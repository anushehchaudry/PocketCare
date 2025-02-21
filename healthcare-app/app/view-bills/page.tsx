"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ViewBillsPage() {
  const [bills, setBills] = useState([
    { id: 1, name: "Hospital Visit - Jan 2023", amount: "$500", file: "hospital_bill_jan2023.pdf" },
    { id: 2, name: "Prescription - Feb 2023", amount: "$100", file: "prescription_feb2023.pdf" },
    { id: 3, name: "Specialist Consultation - Mar 2023", amount: "$250", file: "specialist_mar2023.pdf" },
  ])

  const [newBill, setNewBill] = useState({ name: "", amount: "", file: null })
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = (id) => {
    setBills(bills.filter((bill) => bill.id !== id))
  }

  const handleFileChange = (e) => {
    setNewBill({ ...newBill, file: e.target.files[0] })
  }

  const handleAddBill = (e) => {
    e.preventDefault()
    if (!newBill.name || !newBill.amount || !newBill.file) return

    const newId = Math.max(...bills.map((bill) => bill.id), 0) + 1
    setBills([...bills, { ...newBill, id: newId, file: newBill.file.name }])
    setNewBill({ name: "", amount: "", file: null })
    setIsDialogOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Your Uploaded Bills</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Add New Bill</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bill</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddBill} className="space-y-4">
                <div>
                  <Label htmlFor="billName">Bill Name</Label>
                  <Input
                    id="billName"
                    value={newBill.name}
                    onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billAmount">Amount</Label>
                  <Input
                    id="billAmount"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="billFile">Upload Bill</Label>
                  <Input id="billFile" type="file" onChange={handleFileChange} required />
                </div>
                <Button type="submit">Add Bill</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-4">
          {bills.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
              <div>
                <h2 className="text-lg font-semibold">{bill.name}</h2>
                <p className="text-gray-600">{bill.amount}</p>
                <p className="text-sm text-gray-500">{bill.file}</p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => alert(`Viewing ${bill.file}`)}>
                  View
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(bill.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

