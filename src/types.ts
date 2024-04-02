import {Request, RequestHandler, Response} from "express"
import {z} from "zod"

const routeVariantBaseSchema = z.object({
  id: z.string(),
  delay: z.number().optional(),
})

type RouteVariantBase = z.infer<typeof routeVariantBaseSchema>

const routeVariantJsonSchema = routeVariantBaseSchema.extend({
  type: z.literal("json"),
  response: z.object({
    status: z.number(),
    body: z.unknown(),
  }),
})

export type RouteVariantJson = z.infer<typeof routeVariantJsonSchema>

const routeVariantHandlerSchema = routeVariantBaseSchema.extend({
  type: z.literal("handler"),
  middleware: z.array(z.function()).optional(),
  response: z.function(),
})

export interface ResponseHandlerCtx {
  callCount: number
}

export type RouteVariantHandler<
  Params = object,
  Body = object,
  Query = object,
> = RouteVariantBase & {
  type: "handler"
  middleware?: Array<RequestHandler>
  response: (
    req: Request<Params, object, Body, Query>,
    res: Response,
    ctx: ResponseHandlerCtx,
  ) => void
}

export const routeSchema = z.object({
  id: z.string(),
  url: z.string(),
  method: z.union([
    z.literal("GET"),
    z.literal("POST"),
    z.literal("PUT"),
    z.literal("PATCH"),
    z.literal("DELETE"),
  ]),
  variants: z.array(
    z.union([routeVariantJsonSchema, routeVariantHandlerSchema]),
  ),
})

export type Route = Omit<z.infer<typeof routeSchema>, "variants"> & {
  variants: Array<RouteVariantJson | RouteVariantHandler>
}

export const collectionSchema = z.object({
  id: z.string(),
  routes: z.array(z.string()),
})

export type Collection = z.infer<typeof collectionSchema>

export interface Config {
  delay?: number
  selected?: string
  port?: number
}

export interface Logger {
  info: (msg: string) => void
  error: (msg: string) => void
}

export interface Server {
  start: ({
    routes,
    collections,
  }: {
    routes: Array<Route>
    collections: Array<Collection>
  }) => Promise<void>
}
