"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: string[];
}

export function ValidationErrorModal({ isOpen, onClose, errors }: ValidationErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-[#141414] border-[#1E1E1E]">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Campos Obligatorios Faltantes
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <Alert className="border-red-500 bg-red-500/10 text-red-400">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Por favor completa los siguientes campos obligatorios para continuar:
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>{error}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              onClick={onClose}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Entendido
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
