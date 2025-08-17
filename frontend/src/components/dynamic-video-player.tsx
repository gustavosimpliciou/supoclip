import React, { useRef } from "react";

interface DynamicVideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  className?: string;
}

const DynamicVideoPlayer: React.FC<DynamicVideoPlayerProps> = ({
  src,
  poster = "/placeholder-video.jpg",
  autoPlay = false,
  muted = false,
  loop = false,
  className = "",
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [videoDimensions, setVideoDimensions] = React.useState<{ width: number; height: number } | null>(null);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDimensions({
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      });
    }
  };

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden flex items-center justify-center ${className}`}
      style={
        videoDimensions
          ? {
            width: videoDimensions.width,
            height: videoDimensions.height,
            maxWidth: "100%",
            maxHeight: "70vh",
          }
          : { width: "100%", maxHeight: "70vh" }
      }
    >
      <video
        ref={videoRef}
        controls
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata}
        width={videoDimensions?.width}
        height={videoDimensions?.height}
        className="object-contain bg-black w-full h-full"
        tabIndex={0}
        aria-label="Video player"
        style={
          videoDimensions
            ? {
              width: videoDimensions.width,
              height: videoDimensions.height,
              maxWidth: "100%",
              maxHeight: "70vh",
              display: "block",
              margin: "0 auto",
            }
            : { width: "100%", maxHeight: "70vh" }
        }
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default DynamicVideoPlayer;
