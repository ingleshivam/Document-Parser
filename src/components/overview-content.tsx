"use client";

import React, { useEffect, useState } from "react";
import {
  File,
  FileText,
  MessageCircle,
  Clock,
  BarChart3,
  TrendingUp,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOverviewData } from "@/actions/db-overview";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewData {
  totalDocuments: number;
  totalPages: number;
  totalQuestions: number;
  lastUploadedFile: any;
  recentDocuments: any[];
  recentQuestions: any[];
  recentProcessedDocuments: any[];
}

interface OverviewContentProps {
  refreshTrigger?: number;
}

export function OverviewContent() {
  const [overviewData, setOverviewData] = useState<OverviewData>({
    totalDocuments: 0,
    totalPages: 0,
    totalQuestions: 0,
    lastUploadedFile: null,
    recentDocuments: [],
    recentQuestions: [],
    recentProcessedDocuments: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const result = await getOverviewData();
      console.log("Overview data result:", result);
      if (result.success) {
        setOverviewData(result.data);
        console.log("Overview data set:", result.data);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Dashboard Overview
            </h1>
            <p className="text-muted-foreground mt-1">
              Loading your document data...
            </p>
          </div>
        </div>

        {/* Skeletons for cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-6" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-12 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Skeleton for last uploaded file */}
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div>
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </CardContent>
        </Card>

        {/* Skeleton for recent docs & questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-3 rounded-lg border space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const {
    totalDocuments,
    totalPages,
    totalQuestions,
    lastUploadedFile,
    recentDocuments,
    recentQuestions,
  } = overviewData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your documents.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <File className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
            <p className="text-xs text-muted-foreground">PDFs uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPages}</div>
            <p className="text-xs text-muted-foreground">Pages SUCCESS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Questions Asked
            </CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-xs text-muted-foreground">AI queries made</p>
          </CardContent>
        </Card>
      </div>

      {/* Last Uploaded File */}
      {lastUploadedFile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Last Uploaded File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <File className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {lastUploadedFile.sourceFileName ||
                      lastUploadedFile.fileName}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>
                      {lastUploadedFile.size
                        ? `${(lastUploadedFile.size / 1024).toFixed(1)} KB`
                        : "Unknown size"}
                    </span>
                    <span>•</span>
                    <span>{lastUploadedFile.pageCount || 0} pages</span>
                    <span>•</span>
                    <span>
                      {new Date(
                        lastUploadedFile.uploadedAt
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        lastUploadedFile.uploadedAt
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="default" className="h-7">
                  SUCCESS
                </Badge>
                {/* <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button> */}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <File className="h-5 w-5 mr-2" />
              Recent Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocuments.length > 0 ? (
                recentDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                        <File className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {doc.sourceFileName || doc.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doc.size
                            ? `${(doc.size / 1024).toFixed(1)} KB`
                            : "Unknown size"}{" "}
                          • {doc.pageCount || 0} pages
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-xs text-muted-foreground text-center">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      <Badge variant="default" className="text-xs h-7">
                        SUCCESS
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No documents uploaded yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              Recent Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuestions.length > 0 ? (
                recentQuestions.map((q) => (
                  <div key={q.id} className="p-3 rounded-lg border">
                    <p className="font-medium text-sm mb-2">{q.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {q.conversations?.files?.sourceFileName ||
                        q.conversations?.files?.fileName ||
                        "Unknown document"}{" "}
                      • {new Date(q.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No questions asked yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
