"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";
import SceneSetup from "./scene-setup";
import ModelComponent from "./model-component";
import LoadingPlaceholder from "./loading-placeholder";

export default function ModelViewer({ modelUrl }: { modelUrl: string | null }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  return (
    <div className="w-[calc(100%-3rem)] h-full bg-card bg-radial-gradient m-6 rounded-3xl relative">
      <Canvas camera={{ position: [5, 5, 0], fov: 50 }}>
        <SceneSetup />
        <ambientLight intensity={0.3} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          castShadow
          intensity={90}
        />
        <pointLight position={[-10, -10, -10]} intensity={80} />

        <Suspense fallback={<LoadingPlaceholder />}>
          {modelUrl ? (
            <ModelComponent
              url={modelUrl}
              onLoadingChange={handleLoadingChange}
            />
          ) : (
            <LoadingPlaceholder />
          )}
        </Suspense>

        <OrbitControls
          minDistance={3}
          maxDistance={10}
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={1}
        />
        <Environment preset="night" />
      </Canvas>

      {/* Loading overlay - only show when actually loading */}
      {modelUrl && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">Loading 3D Model...</span>
            </div>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              Please wait while we prepare your model for viewing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
