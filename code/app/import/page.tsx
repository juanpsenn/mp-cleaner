'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import { Sidebar } from '@/components/sidebar'

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' })
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Import failed')
      }

      const result = await response.json()
      setMessage({
        type: 'success',
        text: `Successfully imported ${result.count} records`,
      })
      setFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'An error occurred',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar currentPage="/import" />

      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-6 w-full">
            <h1 className="text-3xl font-bold">Import Records</h1>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 max-w-2xl mx-auto px-4 py-12 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Upload Bank File</CardTitle>
              <CardDescription>
                Upload a CSV or other supported bank export format to import your transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload Area */}
              <div
                className="border-2 border-dashed border-border rounded-lg p-12 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".csv,.txt,.xls,.xlsx"
                />
                
                <div className="space-y-2">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="font-medium text-foreground">
                    {file ? file.name : 'Drop your file here or click to browse'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Supported formats: CSV, TXT, XLS, XLSX
                  </p>
                </div>
              </div>

              {/* Message */}
              {message && (
                <div className={`flex gap-3 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-900 dark:bg-green-900/20'
                    : 'bg-red-50 text-red-900 dark:bg-red-900/20'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p>{message.text}</p>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
                className="w-full"
                size="lg"
              >
                {loading ? 'Uploading...' : 'Upload and Import'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
