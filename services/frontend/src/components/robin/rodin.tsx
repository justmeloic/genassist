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

import { useState, useEffect } from "react";
import { ExternalLink, Download, ArrowLeft } from "lucide-react";
import type { FormValues } from "@/lib/form-schema";
import {
  submitRodinJob,
  checkJobStatus,
  downloadModel,
} from "@/lib/api-service";
import ModelViewer from "./model-viewer";
import Form from "./form";
import StatusIndicator from "./status-indicator";
import OptionsDialog from "./options-dialog";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Rodin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [jobStatuses, setJobStatuses] = useState<
    Array<{ uuid: string; status: string }>
  >([]);
  const [showOptions, setShowOptions] = useState(false);
  const [showPromptContainer, setShowPromptContainer] = useState(true);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [options, setOptions] = useState({
    condition_mode: "concat" as const,
    quality: "medium" as const,
    geometry_file_format: "glb" as const,
    use_hyper: false,
    tier: "Regular" as const,
    TAPose: false,
    material: "PBR" as const,
  });

  // Prevent body scroll on mobile
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      };
    }
  }, [isMobile]);

  const handleOptionsChange = (newOptions: any) => {
    setOptions(newOptions);
  };

  async function handleStatusCheck(subscriptionKey: string, taskUuid: string) {
    try {
      setIsPolling(true);

      const data = await checkJobStatus(subscriptionKey);
      console.log("Status response:", data);

      // Check if jobs array exists
      if (!data.jobs || !Array.isArray(data.jobs) || data.jobs.length === 0) {
        throw new Error("No jobs found in status response");
      }

      // Update job statuses
      setJobStatuses(data.jobs);

      // Check status of all jobs
      const allJobsDone = data.jobs.every((job: any) => job.status === "Done");
      const anyJobFailed = data.jobs.some(
        (job: any) => job.status === "Failed"
      );

      if (allJobsDone) {
        setIsPolling(false);

        // Get the download URL using the task UUID
        try {
          const downloadData = await downloadModel(taskUuid);
          console.log("Download response:", downloadData);

          // Check if there's an error in the download response
          if (downloadData.error && downloadData.error !== "OK") {
            throw new Error(`Download error: ${downloadData.error}`);
          }

          // Find the first GLB file to display in the 3D viewer
          if (downloadData.list && downloadData.list.length > 0) {
            const glbFile = downloadData.list.find((file: { name: string }) =>
              file.name.toLowerCase().endsWith(".glb")
            );

            if (glbFile) {
              const proxyUrl = `/api/proxy-download?url=${encodeURIComponent(
                glbFile.url
              )}`;
              setModelUrl(proxyUrl);
              setDownloadUrl(glbFile.url);
              setIsLoading(false);
              setShowPromptContainer(false);
            } else {
              setError("No GLB file found in the results");
              setIsLoading(false);
            }
          } else {
            setError("No files available for download");
            setIsLoading(false);
          }
        } catch (downloadErr) {
          setError(
            `Failed to download model: ${
              downloadErr instanceof Error
                ? downloadErr.message
                : "Unknown error"
            }`
          );
          setIsLoading(false);
        }
      } else if (anyJobFailed) {
        setIsPolling(false);
        setError("Generation task failed");
        setIsLoading(false);
      } else {
        // Still processing, poll again after a delay
        setTimeout(() => handleStatusCheck(subscriptionKey, taskUuid), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check status");
      setIsPolling(false);
      setIsLoading(false);
    }
  }

  async function handleSubmit(values: FormValues) {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setModelUrl(null);
    setDownloadUrl(null);
    setJobStatuses([]);

    try {
      const formData = new FormData();

      if (values.images && values.images.length > 0) {
        values.images.forEach((image) => {
          formData.append("images", image);
        });
      }

      if (values.prompt) {
        formData.append("prompt", values.prompt);
      }

      // Add all the advanced options
      formData.append("condition_mode", options.condition_mode);
      formData.append("geometry_file_format", options.geometry_file_format);
      formData.append("material", options.material);
      formData.append("quality", options.quality);
      formData.append("use_hyper", options.use_hyper.toString());
      formData.append("tier", options.tier);
      formData.append("TAPose", options.TAPose.toString());
      formData.append("mesh_mode", "Quad");
      formData.append("mesh_simplify", "true");
      formData.append("mesh_smooth", "true");

      // Make the API call through our server route
      const data = await submitRodinJob(formData);
      console.log("Generation response:", data);

      setResult(data);

      // Start polling for status
      if (data.jobs && data.jobs.subscription_key && data.uuid) {
        handleStatusCheck(data.jobs.subscription_key, data.uuid);
      } else {
        setError("Missing required data for status checking");
        setIsLoading(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      setIsLoading(false);
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, "_blank");
    }
  };

  const handleBack = () => {
    setShowPromptContainer(true);
  };

  return (
    <div className="relative h-[66vh] w-full">
      <ModelViewer modelUrl={modelUrl} />

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {/* Links in top right - desktop only */}

        {/* Loading indicator */}
        <StatusIndicator isLoading={isLoading} jobStatuses={jobStatuses} />

        {/* Error message */}
        {error && (
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-gray-900/80 text-white px-4 py-2 rounded-md tracking-normal">
            {error}
          </div>
        )}

        {/* Model controls when model is loaded */}
        {!isLoading && modelUrl && !showPromptContainer && (
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 sm:px-0 pointer-events-auto z-50">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 text-xs border bg-transparent text-gray-500 dark:text-gray-300 dark:border dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={handleDownload}
                className="flex items-center gap-2 px-3 py-2 text-xs border bg-transparent text-gray-500 dark:text-gray-300 dark:border dark:border-gray-700 hover:bg-gradient-to-r hover:from-blue-500/50 hover:to-pink-500/50 hover:text-white rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
          </div>
        )}

        {/* Input field at top */}
        {showPromptContainer && (
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-full max-w-3xl px-4 sm:px-0 pointer-events-auto">
            <Form
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onOpenOptions={() => setShowOptions(true)}
            />
          </div>
        )}
      </div>

      {/* Options Dialog/Drawer */}
      <OptionsDialog
        open={showOptions}
        onOpenChange={setShowOptions}
        options={options}
        onOptionsChange={handleOptionsChange}
      />
    </div>
  );
}
