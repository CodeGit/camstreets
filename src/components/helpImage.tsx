"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogPopup } from "@/components/ui/dialog";

// A small thumbnail that opens the full-size screenshot in a dialog on
// click/tap - used throughout the help page instead of embedding every
// screenshot at full size, which dominated the surrounding text. Click/tap
// rather than hover: hover has no real equivalent on a touch screen, so
// using it as the only way to see the full image would leave mobile
// visitors with no way in. The small always-visible zoom badge gives the
// same "there's more here" affordance on both input types; only the
// on-hover shadow/scale is a desktop-only bonus.
export default function HelpImage({
  src,
  alt,
  width,
  height,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <Dialog>
      <DialogTrigger
        aria-label={`Enlarge screenshot: ${alt}`}
        className="group relative mx-auto block w-full max-w-sm cursor-zoom-in overflow-hidden rounded-lg border border-border shadow-sm transition-shadow hover:shadow-md"
      >
        <Image src={src} alt={alt} width={width} height={height} className="h-auto w-full" />
        <span className="absolute right-2 bottom-2 flex items-center justify-center rounded-full bg-black/60 p-1.5 text-white opacity-80 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3.5 w-3.5" />
        </span>
      </DialogTrigger>
      <DialogPopup className="max-h-[90vh] w-fit max-w-[calc(100vw-2rem)] overflow-auto p-2 sm:max-w-3xl">
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className="h-auto max-h-[80vh] w-auto rounded"
        />
      </DialogPopup>
    </Dialog>
  );
}
