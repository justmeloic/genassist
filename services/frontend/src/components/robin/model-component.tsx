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

"use client";

import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";
import { useGLTF, Center } from "@react-three/drei";
import LoadingSpinner from "./loading-spinner";

interface ModelComponentProps {
  url: string;
  onLoadingChange?: (loading: boolean) => void;
}

export default function ModelComponent({
  url,
  onLoadingChange,
}: ModelComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { scene } = useGLTF(url, undefined, undefined, (error) => {
    //console.error("Error loading model:", error)
  });
  const { camera } = useThree();

  useEffect(() => {
    // Reset camera position when model changes - position higher to account for prompt container
    camera.position.set(0, 0, 5);

    // Set loading to false when scene is loaded
    if (scene) {
      setIsLoading(false);
      onLoadingChange?.(false);
    }

    return () => {
      setIsLoading(true);
      onLoadingChange?.(true);
    };
  }, [url, camera, scene, onLoadingChange]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Center>
      <primitive object={scene} scale={1.5} />
    </Center>
  );
}
