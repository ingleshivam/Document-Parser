"use client";

import React from "react";
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

// Sample data (same as in sidebar)
const uploadedFiles = [
  {
    id: "1",
    name: "shivaji.pdf",
    size: "2.4 MB",
    uploadDate: "2024-01-15",
    uploadTime: "14:30",
    pages: 15,
    status: "SUCCESS",
  },
  {
    id: "2",
    name: "contract_agreement.pdf",
    size: "1.8 MB",
    uploadDate: "2024-01-14",
    uploadTime: "09:15",
    pages: 8,
    status: "PROCESSING",
  },
  {
    id: "3",
    name: "research_paper.pdf",
    size: "5.2 MB",
    uploadDate: "2024-01-13",
    uploadTime: "16:20",
    pages: 32,
    status: "SUCCESS",
  },
  {
    id: "4",
    name: "financial_report.pdf",
    size: "3.1 MB",
    uploadDate: "2024-01-12",
    uploadTime: "11:45",
    pages: 24,
    status: "SUCCESS",
  },
  {
    id: "5",
    name: "user_manual.pdf",
    size: "4.7 MB",
    uploadDate: "2024-01-11",
    uploadTime: "13:20",
    pages: 18,
    status: "SUCCESS",
  },
];

const chatHistory = [
  {
    id: "1",
    fileId: "1",
    question: "What is the main topic of this document?",
    answer:
      "The document discusses the life and achievements of Chhatrapati Shivaji Maharaj, focusing on his military strategies and administrative reforms.",
    timestamp: "2024-01-15 14:30",
  },
  {
    id: "2",
    fileId: "1",
    question: "Summarize the key points",
    answer:
      "Key points include: 1) Military innovations, 2) Fort construction, 3) Naval development, 4) Administrative systems, 5) Religious tolerance policies.",
    timestamp: "2024-01-15 14:45",
  },
  {
    id: "3",
    fileId: "3",
    question: "What are the research findings?",
    answer:
      "The research found significant improvements in efficiency metrics, with a 23% increase in productivity and 15% reduction in operational costs.",
    timestamp: "2024-01-13 16:20",
  },
  {
    id: "4",
    fileId: "4",
    question: "What is the revenue breakdown?",
    answer:
      "Revenue breakdown: Q1: $2.3M, Q2: $2.8M, Q3: $3.1M, Q4: $3.5M. Total annual revenue: $11.7M with 22% YoY growth.",
    timestamp: "2024-01-12 15:30",
  },
  {
    id: "5",
    fileId: "5",
    question: "How do I install the software?",
    answer:
      "Installation steps: 1) Download installer, 2) Run as administrator, 3) Follow setup wizard, 4) Configure settings, 5) Restart system.",
    timestamp: "2024-01-11 14:15",
  },
];

// Calculate statistics
const totalDocuments = uploadedFiles.length;
const totalPages = uploadedFiles.reduce((sum, file) => sum + file.pages, 0);
const totalQuestions = chatHistory.length;
const lastUploadedFile = uploadedFiles.sort(
  (a, b) =>
    new Date(`${b.uploadDate} ${b.uploadTime}`).getTime() -
    new Date(`${a.uploadDate} ${a.uploadTime}`).getTime()
)[0];
const recentDocuments = uploadedFiles
  .sort(
    (a, b) =>
      new Date(`${b.uploadDate} ${b.uploadTime}`).getTime() -
      new Date(`${a.uploadDate} ${a.uploadTime}`).getTime()
  )
  .slice(0, 5);
const recentQuestions = chatHistory
  .sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
  .slice(0, 5);

export function OverviewContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between ">
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
                <h3 className="font-semibold">{lastUploadedFile.name}</h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>{lastUploadedFile.size}</span>
                  <span>•</span>
                  <span>{lastUploadedFile.pages} pages</span>
                  <span>•</span>
                  <span>
                    {lastUploadedFile.uploadDate} at{" "}
                    {lastUploadedFile.uploadTime}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge
                variant={
                  lastUploadedFile.status === "SUCCESS"
                    ? "default"
                    : "secondary"
                }
                className="h-7"
              >
                {lastUploadedFile.status}
              </Badge>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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
              {recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <File className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.size} • {doc.pages} pages
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {doc.uploadDate}
                    </p>
                    <Badge
                      variant={
                        doc.status === "SUCCESS" ? "default" : "secondary"
                      }
                      className="text-xs h-7"
                    >
                      {doc.status}
                    </Badge>
                  </div>
                </div>
              ))}
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
              {recentQuestions.map((q) => (
                <div key={q.id} className="p-3 rounded-lg border">
                  <p className="font-medium text-sm mb-2">{q.question}</p>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                    {q.answer}
                  </p>
                  <p className="text-xs text-muted-foreground">{q.timestamp}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
