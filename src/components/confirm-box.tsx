"use client";
import { deleteProcessedDocumentWithQdrant } from "@/actions/deleteProcessedDocumentWithQdrant";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { toast } from "sonner";
export default function ConfirmBox({
  docId,
  sourceUrl,
  sourceFileName,
  onComplete,
}: {
  docId: any;
  sourceUrl: any;
  sourceFileName: any;
  onComplete: any;
}) {
  const [isComplete, setIsComplete] = useState({ status: false, message: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const handleComplete = () => {
      if (isComplete.status) {
        onComplete(isComplete);
      }
    };
    handleComplete();
  }, [isComplete]);

  const handleDeleteProcessedDocument = async (
    documentId: string,
    sourceUrl: string,
    documentTitle: string
  ) => {
    setIsDeleting(true);
    console.log("Document ID : ", documentId);
    try {
      const result = await deleteProcessedDocumentWithQdrant(
        documentId,
        sourceUrl
      );
      if (result.success) {
        setIsComplete({
          status: true,
          message: result.message ? result.message : "",
        });

        setIsDeleting(false);
        setOpen(false);
      } else {
        toast.error("Failed to delete document", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Failed to delete document", {
        description: "An unexpected error occurred",
      });
    }
  };

  useEffect(() => {
    if (isComplete) {
      onComplete(true);
    }
  }, [isComplete]);

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
            onClick={() => setOpen(true)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-400"
              disabled={isDeleting}
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteProcessedDocument(docId, sourceUrl, sourceFileName);
              }}
            >
              {isDeleting ? (
                <div className="flex gap-3">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Deleting...
                </div>
              ) : (
                <div>Delete</div>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
