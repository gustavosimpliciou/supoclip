"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSession } from "@/lib/auth-client";
import { ArrowLeft, Download, Clock, Star, AlertCircle } from "lucide-react";
import Link from "next/link";
import DynamicVideoPlayer from "@/components/dynamic-video-player";

interface Clip {
  id: string;
  filename: string;
  file_path: string;
  start_time: string;
  end_time: string;
  duration: number;
  text: string;
  relevance_score: number;
  reasoning: string;
  clip_order: number;
  created_at: string;
  video_url: string;
}

interface TaskDetails {
  id: string;
  user_id: string;
  source_id: string;
  source_title: string;
  source_type: string;
  status: string;
  clips_count: number;
  created_at: string;
  updated_at: string;
  font_family?: string;
  font_size?: number;
  font_color?: string;
}

export default function TaskPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskStatus = async () => {
    if (!session?.user?.id || !params.id) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      // Fetch task details (including status)
      const taskResponse = await fetch(`${apiUrl}/tasks/${params.id}`, {
        headers: {
          'user_id': session.user.id,
        },
      });

      if (!taskResponse.ok) {
        throw new Error(`Failed to fetch task: ${taskResponse.status}`);
      }

      const taskData = await taskResponse.json();
      setTask(taskData);

      // Only fetch clips if task is completed
      if (taskData.status === 'completed') {
        const clipsResponse = await fetch(`${apiUrl}/tasks/${params.id}/clips`, {
          headers: {
            'user_id': session.user.id,
          },
        });

        if (!clipsResponse.ok) {
          throw new Error(`Failed to fetch clips: ${clipsResponse.status}`);
        }

        const clipsData = await clipsResponse.json();
        setClips(clipsData.clips || []);
      }

    } catch (err) {
      console.error('Error fetching task data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load task');
    }
  };

  useEffect(() => {
    if (!session?.user?.id || !params.id) return;

    const fetchTaskData = async () => {
      try {
        setIsLoading(true);
        await fetchTaskStatus();
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskData();

    // Set up polling every 5 seconds if task is not completed
    const pollInterval = setInterval(async () => {
      if (task && task.status === 'processing') {
        await fetchTaskStatus();
      } else if (task && (task.status === 'completed' || task.status === 'error')) {
        clearInterval(pollInterval);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [session?.user?.id, params.id, task?.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return "bg-green-100 text-green-800";
    if (score >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-48 w-full mb-4" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-6xl mx-auto">
          <Alert>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>

          {task && (
            <div>
              <h1 className="text-2xl font-bold text-black mb-2">
                {task.source_title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant="outline">{task.source_type}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
                <span>{clips.length} clips generated</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {task?.status === 'processing' ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-xl font-semibold text-black mb-2">Processing Video</h2>
              <p className="text-gray-600">Generating clips from your video. This usually takes 2-3 minutes.</p>
            </div>

            {/* Skeleton for 2 clips being generated */}
            {[1, 2].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Video Player Skeleton */}
                    <div className="bg-gray-200 relative flex-shrink-0 flex items-center justify-center w-full lg:w-96 h-48 lg:h-64">
                      <Skeleton className="w-full h-full" />
                    </div>

                    {/* Clip Details Skeleton */}
                    <div className="p-6 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <Skeleton className="h-6 w-24 mb-2" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-6 w-12" />
                      </div>

                      <div className="mb-4">
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-20 w-full" />
                      </div>

                      <div className="mb-4">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>

                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : task?.status === 'error' ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-red-600 mb-4">
                <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                <h2 className="text-xl font-semibold">Processing Failed</h2>
              </div>
              <p className="text-gray-600 mb-4">There was an error processing your video. Please try again.</p>
              <Link href="/">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : clips.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">No clips have been generated for this task yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Font Settings Display */}
            {task && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-black mb-3 flex items-center gap-2">
                  <span className="w-4 h-4">🎨</span>
                  Font Settings
                </h3>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500">Font:</span>
                    <p className="font-medium">{task.font_family || 'Default'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Size:</span>
                    <p className="font-medium">{task.font_size || 24}px</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <div className="flex items-center gap-1">
                      <div
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: task.font_color || '#FFFFFF' }}
                      ></div>
                      <p className="font-medium">{task.font_color || '#FFFFFF'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {clips.map((clip) => (
              <Card key={clip.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Video Player */}
                    <div className="bg-black relative flex-shrink-0 flex items-center justify-center">
                      <DynamicVideoPlayer src={`http://localhost:8000${clip.video_url}`} poster="/placeholder-video.jpg" />
                    </div>

                    {/* Clip Details */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg text-black mb-1">
                            Clip {clip.clip_order}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{clip.start_time} - {clip.end_time}</span>
                            <span>•</span>
                            <span>{formatDuration(clip.duration)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getScoreColor(clip.relevance_score)}>
                            <Star className="w-3 h-3 mr-1" />
                            {(clip.relevance_score * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>

                      {clip.text && (
                        <div className="mb-4">
                          <h4 className="font-medium text-black mb-2">Transcript</h4>
                          <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                            {clip.text}
                          </p>
                        </div>
                      )}

                      {clip.reasoning && (
                        <div className="mb-4">
                          <h4 className="font-medium text-black mb-2">AI Analysis</h4>
                          <p className="text-sm text-gray-600">
                            {clip.reasoning}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={`http://localhost:8000${clip.video_url}`} download={clip.filename}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
