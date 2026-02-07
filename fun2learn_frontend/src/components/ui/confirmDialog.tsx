"use client";

import Modal from "./modal";
import Button from "./button";

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isLoading?: boolean;
}

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Delete",
    isLoading = false
}: ConfirmDialogProps) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-6">
                <p className="text-gray-600 dark:text-gray-300">{message}</p>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={onClose} className="flex-1" disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={onConfirm}
                        isLoading={isLoading}
                        loadingText="Deleting..."
                        className="flex-1"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;
