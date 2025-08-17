"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { PlayCircle, ArrowRight, Youtube, CheckCircle, AlertCircle, Loader2, Palette, Type, Paintbrush } from "lucide-react";

interface ProcessingStatus {
  step: string;
  message: string;
  progress: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentStep, setCurrentStep] = useState("");
  const [sourceType, setSourceType] = useState<"youtube" | "upload">("youtube");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { data: session, isPending } = useSession();

  // Font customization states
  const [fontFamily, setFontFamily] = useState("TikTokSans-Regular");
  const [fontSize, setFontSize] = useState(24);
  const [fontColor, setFontColor] = useState("#FFFFFF");
  const [availableFonts, setAvailableFonts] = useState<Array<{ name: string, display_name: string }>>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load available fonts on component mount
  useEffect(() => {
    const loadFonts = async () => {
      try {
        const response = await fetch(`${apiUrl}/fonts`);
        if (response.ok) {
          const data = await response.json();
          setAvailableFonts(data.fonts || []);
        }
      } catch (error) {
        console.error('Failed to load fonts:', error);
      }
    };

    loadFonts();
  }, [apiUrl]);

  // Always treat file input as uncontrolled, and store file in a ref
  const fileRef = useRef<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    fileRef.current = file;
    setFileName(file ? file.name : null);
  };

  const getStepIcon = (step: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      validation: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
      user_check: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
      source_analysis: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
      youtube_info: <Youtube className="w-4 h-4 text-red-500" />,
      database_save: <Loader2 className="w-4 h-4 animate-spin text-blue-500" />,
      download: <Loader2 className="w-4 h-4 animate-spin text-green-500" />,
      transcript: <Loader2 className="w-4 h-4 animate-spin text-purple-500" />,
      ai_analysis: <Loader2 className="w-4 h-4 animate-spin text-orange-500" />,
      clip_generation: <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />,
      save_clips: <Loader2 className="w-4 h-4 animate-spin text-pink-500" />,
      complete: <CheckCircle className="w-4 h-4 text-green-500" />,
    };
    return iconMap[step] || <Loader2 className="w-4 h-4 animate-spin text-gray-500" />;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (sourceType === "upload" && !fileRef.current) return;
    if (sourceType === "youtube" && !url.trim()) return;
    if (!session?.user?.id) return;

    setIsLoading(true);
    setProgress(0);
    setError(null);
    setStatusMessage("");
    setCurrentStep("");
    setTaskId(null);
    setSourceTitle(null);

    try {
      let videoUrl = url;

      // If uploading file, upload it first
      if (sourceType === "upload" && fileRef.current) {
        setStatusMessage("Uploading video file...");
        setProgress(5);

        const formData = new FormData();
        formData.append("video", fileRef.current);
        const uploadResponse = await fetch(`${apiUrl}/upload`, {
          method: "POST",
          body: formData
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload error: ${uploadResponse.status}`);
        }

        const uploadResult = await uploadResponse.json();
        videoUrl = uploadResult.video_path;
      }

      // Step 1: Start the task
      const startResponse = await fetch(`${apiUrl}/start-with-progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user_id': session.user.id,
        },
        body: JSON.stringify({
          source: {
            url: videoUrl,
            title: null
          },
          font_options: {
            font_family: fontFamily,
            font_size: fontSize,
            font_color: fontColor
          }
        }),
      });

      if (!startResponse.ok) {
        throw new Error(`API error: ${startResponse.status}`);
      }

      const startResult = await startResponse.json();
      const taskIdFromStart = startResult.task_id;
      setTaskId(taskIdFromStart);

      // Redirect immediately to the task page
      window.location.href = `/tasks/${taskIdFromStart}`;

    } catch (error) {
      console.error('Error processing video:', error);
      setError(error instanceof Error ? error.message : 'Failed to process video. Please try again.');
    } finally {
      setIsLoading(false);
      setProgress(0);
      setStatusMessage("");
      setCurrentStep("");
      setFileName(null);
      fileRef.current = null;
      setUrl("");
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="space-y-4">
          <Skeleton className="h-4 w-32 mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
          <Skeleton className="h-4 w-24 mx-auto" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-24">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-black mb-4">
              SupoClip
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Professional video clipping platform powered by AI
            </p>

            <div className="flex gap-4 justify-center mb-16">
              <Link href="/sign-up">
                <Button size="lg" className="px-8 py-3">
                  Get Started
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg" className="px-8 py-3">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>

          <Separator className="my-16" />

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black mb-2">AI Analysis</h3>
              <p className="text-gray-600">
                Advanced content analysis for optimal clip extraction
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black mb-2">Fast Processing</h3>
              <p className="text-gray-600">
                Enterprise-grade infrastructure for rapid video processing
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-black mb-2">Secure Platform</h3>
              <p className="text-gray-600">
                Enterprise security standards with private processing
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-black">SupoClip</h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback className="bg-gray-100 text-black text-sm">
                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-black">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-black mb-2">
              Video Processing
            </h2>
            <p className="text-gray-600">
              Submit a YouTube URL or upload a video for automated clip generation with customizable fonts
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Source Type Selector */}
            <div className="space-y-2">
              <label htmlFor="source-type" className="text-sm font-medium text-black">
                Source Type
              </label>
              <Select value={sourceType} onValueChange={(value: "youtube" | "upload") => {
                setSourceType(value);
                // Reset file input and fileName when switching to YouTube
                if (value === "youtube") {
                  setFileName(null);
                  fileRef.current = null;
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }
              }} disabled={isLoading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">
                    <div className="flex items-center gap-2">
                      <Youtube className="w-4 h-4" />
                      YouTube URL
                    </div>
                  </SelectItem>
                  <SelectItem value="upload">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Upload Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Input Based on Source Type */}
            {sourceType === "youtube" ? (
              <div className="space-y-2">
                <label htmlFor="youtube-url" className="text-sm font-medium text-black">
                  YouTube URL
                </label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="video-upload" className="text-sm font-medium text-black">
                  Upload Video
                </label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  disabled={isLoading}
                  className="h-11"
                // Do not set value prop, keep input uncontrolled
                />
                {fileName && (
                  <div className="text-xs text-gray-600 mt-1">
                    Selected: {fileName}
                  </div>
                )}
              </div>
            )}

            {/* Font Customization Section */}
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4" />
                  <h3 className="text-sm font-medium text-black">Font & Style Options</h3>
                </div>
                <button type="button" className="text-xs text-gray-500">
                  {showAdvancedOptions ? "Hide" : "Show"}
                </button>
              </div>

              {showAdvancedOptions && (
                <div className="space-y-4 pt-2">
                  {/* Font Family Selector */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      Font Family
                    </label>
                    <Select value={fontFamily} onValueChange={setFontFamily} disabled={isLoading}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFonts.map((font) => (
                          <SelectItem key={font.name} value={font.name}>
                            {font.display_name}
                          </SelectItem>
                        ))}
                        {availableFonts.length === 0 && (
                          <SelectItem value="TikTokSans-Regular">TikTok Sans Regular</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Font Size Slider */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black">
                      Font Size: {fontSize}px
                    </label>
                    <div className="px-2">
                      <Slider
                        value={[fontSize]}
                        onValueChange={(value) => setFontSize(value[0])}
                        max={48}
                        min={12}
                        step={2}
                        disabled={isLoading}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>12px</span>
                      <span>48px</span>
                    </div>
                  </div>

                  {/* Font Color Picker */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-black flex items-center gap-2">
                      <Palette className="w-4 h-4" />
                      Font Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        disabled={isLoading}
                        className="w-12 h-8 rounded border border-gray-300 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <Input
                        type="text"
                        value={fontColor}
                        onChange={(e) => setFontColor(e.target.value)}
                        disabled={isLoading}
                        placeholder="#FFFFFF"
                        className="flex-1 h-8"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {["#FFFFFF", "#000000", "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFontColor(color)}
                          disabled={isLoading}
                          className="w-6 h-6 rounded border-2 border-gray-300 cursor-pointer hover:scale-110 transition-transform disabled:cursor-not-allowed"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mt-4 p-3 bg-black rounded-lg">
                    <p
                      style={{
                        color: fontColor,
                        fontSize: `${Math.min(fontSize, 18)}px`,
                        fontFamily: fontFamily.includes('TikTok') ? 'system-ui' : 'system-ui'
                      }}
                      className="text-center font-medium"
                    >
                      Preview: Your subtitle will look like this
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isLoading && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processing</span>
                    <span className="text-black">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Detailed Status Display */}
                {currentStep && statusMessage && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      {getStepIcon(currentStep)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-black">{statusMessage}</p>
                        {sourceTitle && (
                          <p className="text-xs text-gray-500 mt-1">Processing: {sourceTitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Step Progress Indicator */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'validation' || currentStep === 'user_check' ? 'bg-blue-100' : progress > 15 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${progress > 15 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={progress > 15 ? 'text-green-700' : 'text-gray-600'}>Validation</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'download' || currentStep === 'youtube_info' ? 'bg-green-100' : progress > 30 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${progress > 30 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={progress > 30 ? 'text-green-700' : 'text-gray-600'}>Download</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'transcript' ? 'bg-purple-100' : progress > 45 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${progress > 45 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={progress > 45 ? 'text-green-700' : 'text-gray-600'}>Transcript</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'ai_analysis' ? 'bg-orange-100' : progress > 60 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${progress > 60 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={progress > 60 ? 'text-green-700' : 'text-gray-600'}>AI Analysis</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'clip_generation' ? 'bg-indigo-100' : progress > 75 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${progress > 75 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={progress > 75 ? 'text-green-700' : 'text-gray-600'}>Create Clips</span>
                      </div>
                      <div className={`flex items-center gap-2 p-2 rounded ${currentStep === 'complete' ? 'bg-green-100' : progress >= 100 ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <CheckCircle className={`w-3 h-3 ${progress >= 100 ? 'text-green-500' : 'text-gray-400'}`} />
                        <span className={progress >= 100 ? 'text-green-700' : 'text-gray-600'}>Complete</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <Alert className="mt-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <AlertDescription className="text-sm text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-11"
              disabled={
                (sourceType === "youtube" && !url.trim()) ||
                (sourceType === "upload" && !fileRef.current) ||
                isLoading
              }
            >
              {isLoading ? "Processing..." : "Process Video"}
            </Button>

            {((sourceType === "youtube" && url) || (sourceType === "upload" && fileName)) && !isLoading && (
              <Alert className="mt-6">
                <AlertDescription className="text-sm">
                  Ready to process: {sourceType === "youtube"
                    ? (url.length > 50 ? url.substring(0, 50) + "..." : url)
                    : fileName
                  }
                </AlertDescription>
              </Alert>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
