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
