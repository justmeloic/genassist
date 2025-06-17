"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: {
    condition_mode: "concat" | "fuse";
    quality: "high" | "medium" | "low" | "extra-low";
    geometry_file_format: "glb" | "usdz" | "fbx" | "obj" | "stl";
    use_hyper: boolean;
    tier: "Regular" | "Sketch";
    TAPose: boolean;
    material: "PBR" | "Shaded";
  };
  onOptionsChange: (options: any) => void;
}

export default function OptionsDialog({
  open,
  onOpenChange,
  options,
  onOptionsChange,
}: OptionsDialogProps) {
  const [localOptions, setLocalOptions] = useState(options);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Update local options when props change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const handleChange = (key: string, value: any) => {
    setLocalOptions((prev) => {
      const updated = { ...prev, [key]: value };
      onOptionsChange(updated);
      return updated;
    });
  };

  const content = (
    <div className="py-2">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2 rounded-3xl">
          <TabsTrigger
            value="basic"
            className="tracking-normal opacity-75 rounded-2xl"
          >
            Basic Settings
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="tracking-normal opacity-75 rounded-2xl"
          >
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="ml-2 opacity-65 tracking-normal">Quality</Label>
              <Select
                value={localOptions.quality}
                onValueChange={(value) => handleChange("quality", value)}
              >
                <SelectTrigger className="w-full opacity-75 rounded-2xl">
                  <SelectValue placeholder="Select quality  " />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="opacity-75" value="high">
                    High (50k)
                  </SelectItem>
                  <SelectItem className="opacity-75" value="medium">
                    Medium (18k)
                  </SelectItem>
                  <SelectItem className="opacity-75" value="low">
                    Low (8k)
                  </SelectItem>
                  <SelectItem className="opacity-75" value="extra-low">
                    Extra Low (4k)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="ml-2 opacity-65 tracking-normal">Format</Label>
              <Select
                value={localOptions.geometry_file_format}
                onValueChange={(value) =>
                  handleChange("geometry_file_format", value)
                }
              >
                <SelectTrigger className="w-full opacity-75  rounded-2xl">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="opacity-75" value="glb">
                    GLB
                  </SelectItem>
                  <SelectItem className="opacity-75" value="usdz">
                    USDZ
                  </SelectItem>
                  <SelectItem className="opacity-75" value="fbx">
                    FBX
                  </SelectItem>
                  <SelectItem className="opacity-75" value="obj">
                    OBJ
                  </SelectItem>
                  <SelectItem className="opacity-75" value="stl">
                    STL
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 ">
            <div className="flex flex-row items-center justify-between rounded-2xl border border-border p-3">
              <div className="space-y-0.5">
                <Label className="opacity-65 tracking-normal">Use Hyper</Label>
                <p className="text-xs text-muted-foreground">Better details</p>
              </div>
              <Switch
                checked={localOptions.use_hyper}
                onCheckedChange={(checked) =>
                  handleChange("use_hyper", checked)
                }
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-2xl border border-border p-3">
              <div className="space-y-0.5">
                <Label className="opacity-65 tracking-normal">T/A Pose</Label>
                <p className="text-xs text-muted-foreground">For humans</p>
              </div>
              <Switch
                checked={localOptions.TAPose}
                onCheckedChange={(checked) => handleChange("TAPose", checked)}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label className="opacity-65 tracking-normal">Condition Mode</Label>
            <RadioGroup
              value={localOptions.condition_mode}
              onValueChange={(value) => handleChange("condition_mode", value)}
              className="space-y-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="concat" id="concat" />
                <Label htmlFor="concat" className="font-normal">
                  Concat (Single object, multiple views)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fuse" id="fuse" />
                <Label htmlFor="fuse" className="font-normal">
                  Fuse (Multiple objects)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="opacity-65 tracking-normal">Material</Label>
            <RadioGroup
              value={localOptions.material}
              onValueChange={(value) => handleChange("material", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PBR" id="pbr" />
                <Label htmlFor="pbr" className="font-normal">
                  PBR
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Shaded" id="shaded" />
                <Label htmlFor="shaded" className="font-normal">
                  Shaded
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="opacity-65 tracking-normal">
              Generation Tier
            </Label>
            <RadioGroup
              value={localOptions.tier}
              onValueChange={(value) => handleChange("tier", value)}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Regular" id="regular" />
                <Label htmlFor="regular" className="font-normal">
                  Regular (Quality)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Sketch" id="sketch" />
                <Label htmlFor="sketch" className="font-normal">
                  Sketch (Speed)
                </Label>
              </div>
            </RadioGroup>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl ml-4 opacity-70">
              Options
            </DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle className="text-xl ml-4">Options</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">{content}</div>
          <DrawerFooter>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Apply Settings
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
