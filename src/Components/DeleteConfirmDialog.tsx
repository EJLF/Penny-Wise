import { useEffect, useRef } from 'react'

type DeleteConfirmDialogProps = {
  itemName: string
  itemType: string
  onConfirm: () => void
  onCancel: () => void
}

const DeleteConfirmDialog = ({
  itemName,
  itemType,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal()
    }
  }, [])

  const closeDialog = () => {
    dialogRef.current?.close()
  }

  return (
    <dialog
      ref={dialogRef}
      className="transaction-dialog delete-confirm-dialog"
      aria-labelledby="delete-confirm-title"
      aria-describedby="delete-confirm-description"
      onClose={onCancel}
      onClick={(event) => {
        const dialog = event.currentTarget
        const bounds = dialog.getBoundingClientRect()
        if (
          event.target === dialog &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        ) {
          closeDialog()
        }
      }}
    >
      <section className="panel delete-confirm-dialog__panel">
        <div className="panel__heading">
          <div>
            <h2 className="panel__title" id="delete-confirm-title">Delete {itemType}?</h2>
            <p className="panel__subtitle" id="delete-confirm-description">
              "{itemName}" will be permanently removed.
            </p>
          </div>
          <button
            className="transaction-dialog__close"
            type="button"
            onClick={closeDialog}
            aria-label="Cancel deletion"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="delete-confirm-dialog__actions">
          <button className="btn delete-confirm-dialog__cancel" type="button" onClick={closeDialog}>
            Cancel
          </button>
          <button
            className="btn delete-confirm-dialog__delete"
            type="button"
            onClick={() => {
              dialogRef.current?.close()
              onConfirm()
            }}
          >
            Delete {itemType}
          </button>
        </div>
      </section>
    </dialog>
  )
}

export default DeleteConfirmDialog
