'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/Dialog'
import { DollarSign, Plus, Receipt, TrendingUp, TrendingDown, PieChart } from 'lucide-react'
import { createClientSupabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import toast from 'react-hot-toast'

interface Expense {
  id: string
  category: string
  description: string
  amount: number
  currency: string
  date: string
  location?: string
  receipt_url?: string
  created_at: string
}

interface BudgetTrackerProps {
  tripId: string
  userId: string
  budget?: number
  currency?: string
  className?: string
}

const EXPENSE_CATEGORIES = [
  'Accommodation',
  'Transportation',
  'Food & Dining',
  'Activities',
  'Shopping',
  'Entertainment',
  'Health & Medical',
  'Communication',
  'Tips & Service',
  'Other'
]

const CATEGORY_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6B7280'
]

export function BudgetTracker({
  tripId,
  userId,
  budget = 0,
  currency = 'USD',
  className = ''
}: BudgetTrackerProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newExpense, setNewExpense] = useState({
    category: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: ''
  })

  const supabase = createClientSupabase()

  useEffect(() => {
    loadExpenses()
  }, [tripId])

  const loadExpenses = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('trip_expenses')
        .select('*')
        .eq('trip_id', tripId)
        .order('date', { ascending: false })

      if (error) throw error

      setExpenses(data || [])
    } catch (error) {
      console.error('Error loading expenses:', error)
      toast.error('Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }

  const addExpense = async () => {
    if (!newExpense.category || !newExpense.description || !newExpense.amount) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { data, error } = await supabase
        .from('trip_expenses')
        .insert({
          trip_id: tripId,
          user_id: userId,
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          currency,
          date: newExpense.date,
          location: newExpense.location || null
        })
        .select()
        .single()

      if (error) throw error

      setExpenses(prev => [data, ...prev])
      setNewExpense({
        category: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        location: ''
      })
      setShowAddForm(false)
      toast.success('Expense added successfully')
    } catch (error) {
      console.error('Error adding expense:', error)
      toast.error('Failed to add expense')
    }
  }

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trip_expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      setExpenses(prev => prev.filter(expense => expense.id !== id))
      toast.success('Expense deleted')
    } catch (error) {
      console.error('Error deleting expense:', error)
      toast.error('Failed to delete expense')
    }
  }

  // Calculate statistics
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remaining = budget - totalSpent
  const budgetUsedPercentage = budget > 0 ? (totalSpent / budget) * 100 : 0

  // Group expenses by category
  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const categoryData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : '0'
  }))

  // Daily spending data
  const dailySpending = expenses.reduce((acc, expense) => {
    const date = expense.date
    acc[date] = (acc[date] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const dailyData = Object.entries(dailySpending)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({
      date: format(new Date(date), 'MMM d'),
      amount
    }))

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-300 rounded"></div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Budget Tracker</h2>
          <p className="text-gray-600">Track your travel expenses and stay within budget</p>
        </div>
        
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value: string) => setNewExpense(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What did you spend on?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ({currency})</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <Input
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location (optional)</label>
                <Input
                  value={newExpense.location}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Where did you spend this?"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={addExpense}>Add Expense</Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Spent</p>
              <p className="text-xl font-bold">{currency} {totalSpent.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              remaining >= 0 ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {remaining >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className={`text-xl font-bold ${
                remaining >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {currency} {remaining.toFixed(2)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <PieChart className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Budget Used</p>
              <p className="text-xl font-bold">{budgetUsedPercentage.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Budget Progress Bar */}
      {budget > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Budget Progress</span>
            <span className="text-sm text-gray-600">
              {currency} {totalSpent.toFixed(2)} / {currency} {budget.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                budgetUsedPercentage > 100 ? 'bg-red-500' : 
                budgetUsedPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}
            />
          </div>
        </Card>
      )}

      {/* Charts */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Spending by Category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${currency} ${value.toFixed(2)}`, 'Amount']} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Daily Spending */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Daily Spending</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${currency} ${value.toFixed(2)}`, 'Amount']} />
                  <Bar dataKey="amount" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Expense List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Recent Expenses</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No expenses recorded yet</p>
            <p className="text-sm">Add your first expense to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">{expense.category}</Badge>
                    <span className="text-sm text-gray-600">
                      {format(new Date(expense.date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <h4 className="font-medium">{expense.description}</h4>
                  {expense.location && (
                    <p className="text-sm text-gray-600">{expense.location}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-semibold">{currency} {expense.amount.toFixed(2)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExpense(expense.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
