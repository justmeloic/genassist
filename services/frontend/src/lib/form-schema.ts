/**
 * Copyright 2025 Loïc Muhirwa
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as z from "zod"

export const formSchema = z
  .object({
    images: z.array(z.instanceof(File)).optional(),
    prompt: z.string().optional(),
    condition_mode: z.enum(["concat", "fuse"]).default("concat"),
    quality: z.enum(["high", "medium", "low", "extra-low"]).default("medium"),
    geometry_file_format: z.enum(["glb", "usdz", "fbx", "obj", "stl"]).default("glb"),
    use_hyper: z.boolean().default(false),
    tier: z.enum(["Regular", "Sketch"]).default("Regular"),
    TAPose: z.boolean().default(false),
    material: z.enum(["PBR", "Shaded"]).default("PBR"),
  })
  .refine(
    (data) => {
      // Require at least one of images or prompt
      return (data.images && data.images.length > 0) || (data.prompt && data.prompt.length > 0)
    },
    {
      message: "You must provide either images or a prompt",
      path: ["prompt"],
    },
  )

export type FormValues = z.infer<typeof formSchema>
