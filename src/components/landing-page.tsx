"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  FileText,
  MessageSquare,
  Upload,
  Zap,
  Shield,
  BarChart3,
  Sparkles,
  Brain,
  Clock,
  CheckCircle,
  Play,
  Star,
  Users,
  TrendingUp,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { ThemeButton } from "./theme-button";
import { useSession } from "next-auth/react";
import Loader from "./loader";

export default function LandingPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-full h-screen flex items-center justify-center ">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2.5 shadow-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Document Parser
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {status === "unauthenticated" ? (
                <Link href="/auth/signin">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Button>
                </Link>
              )}

              <ThemeButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse animation-delay-2000"></div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Content */}
            <div className="space-y-8">
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/20 shadow-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Document Intelligence
              </Badge>

              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight">
                  Transform your{" "}
                  <span className="bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">
                    documents
                  </span>{" "}
                  into conversations
                </h1>

                <p className="text-xl text-muted-foreground text-pretty max-w-2xl leading-relaxed">
                  Upload any PDF, extract intelligent insights, and chat with
                  your documents using advanced AI. Get instant answers, deep
                  analysis, and actionable insights from your files.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/signup">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                {/* <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-6 group bg-transparent hover:bg-accent/10 border-2 hover:border-primary/30 transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button> */}
              </div>

              {/* <div className="flex items-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Free 14-day trial</span>
                </div>
              </div> */}

              {/* Social Proof */}
              {/* <div className="pt-4">
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <div className="flex -space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className="w-4 h-4 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                    <span className="ml-2 font-medium">4.9/5</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Trusted by 10,000+ professionals</span>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Right side - Enhanced Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-3xl p-8 border border-primary/20 shadow-2xl backdrop-blur-sm">
                <Card className="bg-card/80 backdrop-blur-sm border-0 shadow-2xl overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-primary" />
                        <span>Document Analysis</span>
                      </CardTitle>
                      <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 animate-pulse">
                        Processing...
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full w-3/4 animate-pulse"></div>
                          </div>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          85%
                        </span>
                      </div>

                      <div className="bg-gradient-to-r from-muted/50 to-accent/10 rounded-xl p-4 space-y-3 border border-primary/10">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-semibold">
                              Key Insights Extracted
                            </p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Found 23 important concepts, 8 action items, and 3
                              key decisions with 99.2% confidence
                            </p>
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3 text-primary" />
                                <span className="text-primary font-medium">
                                  High Priority
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span>2.3s processing</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Enhanced Floating elements */}
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-2xl p-4 shadow-xl animate-bounce">
                <Zap className="w-6 h-6" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-card border-2 border-primary/20 shadow-xl rounded-2xl p-4 backdrop-blur-sm">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <div className="absolute top-1/2 -left-4 bg-gradient-to-br from-accent/80 to-accent text-accent-foreground rounded-xl p-3 shadow-lg animate-pulse animation-delay-1000">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-muted/30 via-muted/20 to-accent/10 border-y border-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center space-y-3 group">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                50k+
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Documents Processed
              </div>
            </div>
            <div className="text-center space-y-3 group">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                99.9%
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Accuracy Rate
              </div>
            </div>
            <div className="text-center space-y-3 group">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                2.3s
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Average Processing
              </div>
            </div>
            <div className="text-center space-y-3 group">
              <div className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                24/7
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                AI Availability
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/20"
            >
              Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-balance">
              Everything you need to work{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                smarter
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
              Powerful AI-driven features designed to transform how you interact
              with documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 bg-gradient-to-br from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 transition-all duration-500 hover:shadow-2xl hover:scale-105 group backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                  <Upload className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Smart Upload
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Drag, drop, or upload PDFs instantly. Our AI automatically
                  detects document type and optimizes processing for maximum
                  accuracy.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 transition-all duration-500 hover:shadow-2xl hover:scale-105 group backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                  <Brain className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  AI Intelligence
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Advanced machine learning extracts meaning, context, and
                  insights from your documents with human-level understanding
                  and precision.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 transition-all duration-500 hover:shadow-2xl hover:scale-105 group backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                  <MessageSquare className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Natural Conversations
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Ask questions in plain English and get precise, contextual
                  answers backed by your document content with source citations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 transition-all duration-500 hover:shadow-2xl hover:scale-105 group backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                  <Shield className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Enterprise Security
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Bank-level encryption, SOC 2 compliance, and zero data
                  retention policies keep your documents secure and private.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 transition-all duration-500 hover:shadow-2xl hover:scale-105 group backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                  <Clock className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Lightning Fast
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Process documents in seconds, not hours. Get instant insights
                  and answers without waiting, powered by optimized AI.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-card/50 to-card/30 hover:from-card/80 hover:to-card/60 transition-all duration-500 hover:shadow-2xl hover:scale-105 group backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-all duration-300 shadow-lg">
                  <BarChart3 className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Smart Analytics
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Track usage patterns, discover insights, and optimize your
                  document workflow with detailed analytics and reporting.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-muted/20 via-transparent to-accent/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16 space-y-4">
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/20"
            >
              How It Works
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold text-balance">
              Get started in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                3 simple steps
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-primary-foreground">
                    1
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-accent to-accent/80 rounded-full animate-ping"></div>
              </div>
              <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                Upload Document
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Simply drag and drop your PDF or select files from your device.
                We support all major document formats with intelligent
                preprocessing.
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-primary-foreground">
                    2
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-accent to-accent/80 rounded-full animate-ping animation-delay-1000"></div>
              </div>
              <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                AI Processing
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Our advanced AI analyzes your document, extracting key
                information, context, and creating a searchable knowledge base
                with 99.9% accuracy.
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300">
                  <span className="text-3xl font-bold text-primary-foreground">
                    3
                  </span>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-accent to-accent/80 rounded-full animate-ping animation-delay-2000"></div>
              </div>
              <h3 className="text-2xl font-semibold group-hover:text-primary transition-colors">
                Start Chatting
              </h3>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Ask questions, request summaries, or explore insights. Get
                intelligent responses based on your document content with
                instant citations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-primary/95 to-accent text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-accent/90"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-2 h-2 bg-primary-foreground rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-20 w-1 h-1 bg-primary-foreground rounded-full animate-pulse animation-delay-1000"></div>
          <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-primary-foreground rounded-full animate-pulse animation-delay-2000"></div>
          <div className="absolute bottom-10 right-10 w-2 h-2 bg-primary-foreground rounded-full animate-pulse animation-delay-500"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <h2 className="text-4xl sm:text-5xl font-bold text-balance">
            Ready to transform your document workflow?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto text-pretty leading-relaxed">
            Join thousands of professionals who are already using AI to work
            smarter, not harder. Experience the future of document intelligence
            today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto text-lg px-8 py-6 bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {/* <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-lg px-8 py-6 border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent backdrop-blur-sm transition-all duration-300"
            >
              Contact Sales
            </Button> */}
          </div>
          {/* <p className="text-sm text-primary-foreground/70">
            No credit card required • 14-day free trial • Cancel anytime • 99.9%
            uptime guarantee
          </p> */}
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-card to-muted/20 border-t border-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary to-primary/80 rounded-xl p-2.5 shadow-lg">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Document Parser
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 Shivam Ingle. All rights reserved. Built with ❤️ for
              productivity.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
