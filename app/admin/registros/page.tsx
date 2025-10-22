"use client"

import { useState, useEffect } from "react"
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Eye,
  Filter,
  History,
  Search,
  User,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Interfaces para los datos
interface Closing {
  id: string
  date: Date
  user: string
  status: string
  difference: number
  notes: string
  balances?: Record<string, any>
}

interface Transaction {
  id: string
  closingId: string | null
  time: Date
  type: string
  amount: number
  currency: string
  description: string
  user: string
}

export default function RegistrosPage() {
  // Estados para los datos
  const [closings, setClosings] = useState<Closing[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  // Estados para UI
  const [expandedClosing, setExpandedClosing] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [userFilter, setUserFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedClosingId, setSelectedClosingId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("balance")
  const [isExporting, setIsExporting] = useState(false)

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)

  // Cargar datos de Firebase
  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        // Cargar cierres de caja
        const closingsQuery = query(collection(db, "cashClosings"), orderBy("date", "desc"))
        const closingsSnapshot = await getDocs(closingsQuery)
        const closingsData = closingsSnapshot.docs.map((doc) => {
          const data = doc.data()
          // Manejar diferentes formatos de fecha
          let dateValue = new Date()
          if (data.date) {
            if (typeof data.date.toDate === "function") {
              dateValue = data.date.toDate()
            } else if (data.date.seconds) {
              dateValue = new Date(data.date.seconds * 1000)
            } else if (typeof data.date === "string") {
              dateValue = new Date(data.date)
            }
          }

          return {
            id: doc.id,
            date: dateValue,
            user: data.user || "Desconocido",
            status: data.status || "Correcto",
            difference: data.difference || 0,
            notes: data.notes || "",
            balances: data.balance || {}, // Corregido de balances a balance
          }
        })
        setClosings(closingsData)

        // Cargar transacciones desde MongoDB
        const transactionsResponse = await fetch('/api/cash-transactions')
        if (!transactionsResponse.ok) throw new Error('Failed to fetch transactions')
        const transactionsFromMongo = await transactionsResponse.json()
        const transactionsData = transactionsFromMongo.map((data: any) => {
          // Manejar diferentes formatos de fecha
          let timeValue = new Date()
          if (data.time) {
            if (typeof data.time.toDate === "function") {
              timeValue = data.time.toDate()
            } else if (data.time.seconds) {
              timeValue = new Date(data.time.seconds * 1000)
            } else if (typeof data.time === "string") {
              timeValue = new Date(data.time)
            }
          }

          return {
            id: doc.id,
            closingId: data.closingId || null,
            time: timeValue,
            type: data.type || "Desconocido",
            amount: data.amount || 0,
            currency: data.currency || "PESO",
            description: data.description || "",
            user: data.user || "Desconocido",
          }
        })
        setTransactions(transactionsData)
      } catch (error) {
        console.error("Error al cargar datos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Filtrar los cierres de caja según los criterios
  const filteredClosings = closings.filter((closing) => {
    const matchesSearch =
      closing.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      closing.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      closing.status.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" && new Date(closing.date).toDateString() === new Date().toDateString()) ||
      (dateFilter === "yesterday" &&
        new Date(closing.date).toDateString() === new Date(Date.now() - 86400000).toDateString()) ||
      (dateFilter === "thisWeek" && new Date(closing.date) > new Date(Date.now() - 7 * 86400000))

    const matchesUser = userFilter === "all" || closing.user === userFilter

    const matchesStatus = statusFilter === "all" || closing.status === statusFilter

    return matchesSearch && matchesDate && matchesUser && matchesStatus
  })

  // Calcular el total de páginas
  const totalPages = Math.ceil(filteredClosings.length / itemsPerPage)

  // Obtener los cierres para la página actual
  const currentClosings = filteredClosings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Obtener transacciones para un cierre específico
  const getTransactionsForClosing = (closingId: string) => {
    return transactions.filter((transaction) => transaction.closingId === closingId)
  }

  // Manejar la expansión de un cierre
  const toggleExpand = (closingId: string) => {
    if (expandedClosing === closingId) {
      setExpandedClosing(null)
    } else {
      setExpandedClosing(closingId)
    }
  }

  // Mostrar el modal de detalles
  const showDetails = (closingId: string, tab = "balance") => {
    setSelectedClosingId(closingId)
    setActiveTab(tab)
    setShowDetailModal(true)
  }

  // Cambiar de página
  const changePage = (page: number) => {
    setCurrentPage(page)
    setExpandedClosing(null) // Cerrar cualquier fila expandida al cambiar de página
  }

  // Exportar a CSV
  const exportToCSV = async () => {
    try {
      setIsExporting(true)

      // Preparar los datos para exportar
      const dataToExport = filteredClosings.map((closing) => {
        return {
          ID: closing.id,
          Fecha: format(closing.date, "dd/MM/yyyy", { locale: es }),
          Hora: format(closing.date, "HH:mm", { locale: es }),
          Usuario: closing.user,
          Estado: closing.status,
          Diferencia: closing.difference,
          Notas: closing.notes || "",
        }
      })

      // Crear el contenido CSV
      let csvContent = "ID,Fecha,Hora,Usuario,Estado,Diferencia,Notas\n"

      dataToExport.forEach((row) => {
        const values = Object.values(row).map((value) => {
          // Escapar comillas y contenido con comas
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        csvContent += values.join(",") + "\n"
      })

      // Crear un blob y un enlace de descarga
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.setAttribute("href", url)
      link.setAttribute("download", `registros-caja-${format(new Date(), "yyyy-MM-dd")}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setIsExporting(false)
    } catch (error) {
      console.error("Error al exportar datos:", error)
      setIsExporting(false)
      // Aquí podrías mostrar una notificación de error
    }
  }

  // Obtener usuarios únicos para el filtro
  const uniqueUsers = Array.from(new Set(closings.map((closing) => closing.user)))

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Registros de Caja</h1>
        <Button variant="outline" onClick={exportToCSV} disabled={loading || closings.length === 0}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fechas</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="yesterday">Ayer</SelectItem>
                <SelectItem value="thisWeek">Esta semana</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger>
                <User className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los usuarios</SelectItem>
                {uniqueUsers.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="Correcto">Correcto</SelectItem>
                <SelectItem value="Faltante">Faltante</SelectItem>
                <SelectItem value="Sobrante">Sobrante</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cierres de Caja</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando registros...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentClosings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No se encontraron registros que coincidan con los filtros.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentClosings.map((closing) => (
                      <>
                        <TableRow key={closing.id}>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => toggleExpand(closing.id)}>
                              {expandedClosing === closing.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>{format(closing.date, "dd/MM/yyyy", { locale: es })}</TableCell>
                          <TableCell>{format(closing.date, "HH:mm", { locale: es })}</TableCell>
                          <TableCell>{closing.user}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                closing.status === "Correcto"
                                  ? "default"
                                  : closing.status === "Faltante"
                                    ? "destructive"
                                    : "outline"
                              }
                            >
                              {closing.status}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={
                              closing.difference === 0 ? "" : closing.difference < 0 ? "text-red-600" : "text-green-600"
                            }
                          >
                            {closing.difference === 0
                              ? "-"
                              : closing.difference < 0
                                ? `$${closing.difference}`
                                : `+$${closing.difference}`}
                          </TableCell>
                          <TableCell>{closing.notes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => showDetails(closing.id, "balance")}>
                                <Eye className="h-4 w-4 mr-1" />
                                Balance
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => showDetails(closing.id, "history")}>
                                <History className="h-4 w-4 mr-1" />
                                Historial
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedClosing === closing.id && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0 border-t-0">
                              <div className="bg-muted/50 p-4">
                                <h4 className="font-medium mb-2">Resumen de Transacciones</h4>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-sm text-muted-foreground">
                                    Mostrando {Math.min(3, getTransactionsForClosing(closing.id).length)} de{" "}
                                    {getTransactionsForClosing(closing.id).length} transacciones
                                  </p>
                                  <Button variant="link" size="sm" onClick={() => showDetails(closing.id, "history")}>
                                    Ver todas
                                  </Button>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Hora</TableHead>
                                      <TableHead>Tipo</TableHead>
                                      <TableHead>Monto</TableHead>
                                      <TableHead>Moneda</TableHead>
                                      <TableHead>Descripción</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {getTransactionsForClosing(closing.id)
                                      .slice(0, 3) // Mostrar solo las primeras 3 transacciones
                                      .map((transaction) => (
                                        <TableRow key={transaction.id}>
                                          <TableCell>{format(transaction.time, "HH:mm", { locale: es })}</TableCell>
                                          <TableCell>
                                            <Badge
                                              variant={
                                                transaction.type === "Venta"
                                                  ? "default"
                                                  : transaction.type === "Ingreso"
                                                    ? "outline"
                                                    : "secondary"
                                              }
                                            >
                                              {transaction.type}
                                            </Badge>
                                          </TableCell>
                                          <TableCell
                                            className={transaction.amount < 0 ? "text-red-600" : "text-green-600"}
                                          >
                                            {transaction.amount < 0
                                              ? `$${transaction.amount}`
                                              : `$${transaction.amount}`}
                                          </TableCell>
                                          <TableCell>{transaction.currency}</TableCell>
                                          <TableCell>{transaction.description}</TableCell>
                                        </TableRow>
                                      ))}
                                    {getTransactionsForClosing(closing.id).length === 0 && (
                                      <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4">
                                          No hay transacciones registradas para este cierre.
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => changePage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para mostrar detalles (balance e historial) */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Detalles del Cierre #{selectedClosingId?.substring(0, 6)} -{" "}
              {selectedClosingId &&
                format(closings.find((c) => c.id === selectedClosingId)?.date || new Date(), "dd/MM/yyyy", {
                  locale: es,
                })}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="balance">Balance</TabsTrigger>
              <TabsTrigger value="history">Historial Completo</TabsTrigger>
            </TabsList>

            <TabsContent value="balance" className="overflow-auto max-h-[70vh]">
              {selectedClosingId && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Moneda</TableHead>
                      <TableHead>Ingreso</TableHead>
                      <TableHead>Egreso</TableHead>
                      <TableHead>Nos Deben</TableHead>
                      <TableHead>Debemos</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClosingId &&
                      closings.find((c) => c.id === selectedClosingId)?.balances &&
                      Object.entries(closings.find((c) => c.id === selectedClosingId)?.balances || {})
                        .filter(([currency]) => currency !== "date") // Filtrar la entrada "date"
                        .map(([currency, data]: [string, any]) => (
                          <TableRow key={currency}>
                            <TableCell className="font-medium">
                              {currency === "ARS"
                                ? "🇦🇷 PESO ARS"
                                : currency === "ARS_TRANSFER"
                                  ? "🇦🇷 PESO TRANSF."
                                  : currency === "USD"
                                    ? "🇺🇸 USD"
                                    : currency === "USDT"
                                      ? "🪙 USDT"
                                      : currency === "GUARANI"
                                        ? "🇵🇾 GUARANÍ"
                                        : currency === "REAL"
                                          ? "🇧🇷 REAL"
                                          : currency === "EUR"
                                            ? "🇪🇺 EURO"
                                            : currency === "CLP"
                                              ? "🇨🇱 PESO CL"
                                              : currency === "UYU"
                                                ? "🇺🇾 PESO UY"
                                                : currency}
                            </TableCell>
                            <TableCell className="text-green-600">{data.income ? `$${data.income}` : "$0"}</TableCell>
                            <TableCell className="text-red-600">{data.expense ? `$${data.expense}` : "$0"}</TableCell>
                            <TableCell className="text-amber-600">{data.theyOwe ? `$${data.theyOwe}` : "$0"}</TableCell>
                            <TableCell className="text-blue-600">{data.weOwe ? `$${data.weOwe}` : "$0"}</TableCell>
                            <TableCell className="text-green-700 font-bold">
                              {data.balance ? `$${data.balance}` : "$0"}
                            </TableCell>
                          </TableRow>
                        ))}
                    {(!selectedClosingId ||
                      !closings.find((c) => c.id === selectedClosingId)?.balances ||
                      Object.keys(closings.find((c) => c.id === selectedClosingId)?.balances || {}).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No hay información de balance disponible para este cierre.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}

              <div className="mt-6 p-4 bg-muted rounded-md">
                <h3 className="font-medium mb-2">Resumen del Cierre</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Usuario:</p>
                    <p className="font-medium">
                      {selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.user}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fecha y hora:</p>
                    <p className="font-medium">
                      {selectedClosingId &&
                        format(
                          closings.find((c) => c.id === selectedClosingId)?.date || new Date(),
                          "dd/MM/yyyy HH:mm",
                          { locale: es },
                        )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Estado:</p>
                    <Badge
                      variant={
                        selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.status === "Correcto"
                          ? "default"
                          : selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.status === "Faltante"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Diferencia:</p>
                    <p
                      className={
                        selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.difference === 0
                          ? ""
                          : selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.difference < 0
                            ? "text-red-600 font-medium"
                            : "text-green-600 font-medium"
                      }
                    >
                      {selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.difference === 0
                        ? "-"
                        : selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.difference < 0
                          ? `$${closings.find((c) => c.id === selectedClosingId)?.difference}`
                          : `+$${closings.find((c) => c.id === selectedClosingId)?.difference}`}
                    </p>
                  </div>
                </div>
                {selectedClosingId && closings.find((c) => c.id === selectedClosingId)?.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground">Notas:</p>
                    <p className="p-2 bg-background rounded border mt-1">
                      {closings.find((c) => c.id === selectedClosingId)?.notes}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="history" className="overflow-auto max-h-[70vh]">
              <div className="mb-4">
                <h3 className="font-medium mb-2">Historial Completo del Día</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Todas las transacciones registradas el{" "}
                  {selectedClosingId &&
                    format(closings.find((c) => c.id === selectedClosingId)?.date || new Date(), "dd/MM/yyyy", {
                      locale: es,
                    })}
                </p>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Moneda</TableHead>
                      <TableHead>Descripción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedClosingId &&
                      getTransactionsForClosing(selectedClosingId)
                        .sort((a, b) => a.time.getTime() - b.time.getTime())
                        .map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell>{format(transaction.time, "HH:mm", { locale: es })}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  transaction.type === "Venta"
                                    ? "default"
                                    : transaction.type === "Ingreso"
                                      ? "outline"
                                      : "secondary"
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={transaction.amount < 0 ? "text-red-600" : "text-green-600"}>
                              {transaction.currency === "GUARANI"
                                ? "₲"
                                : transaction.currency === "REAL"
                                  ? "R$"
                                  : transaction.currency === "ARS"
                                    ? "🇦🇷 $"
                                    : "$"}
                              {Math.abs(transaction.amount).toLocaleString()}
                              {transaction.amount < 0 ? " (-)" : ""}
                            </TableCell>
                            <TableCell>
                              {transaction.currency === "ARS"
                                ? "💵"
                                : transaction.currency === "USD"
                                  ? "💰"
                                  : transaction.currency === "USDT"
                                    ? "🪙"
                                    : transaction.currency === "GUARANI"
                                      ? "🇵🇾"
                                      : transaction.currency === "REAL"
                                        ? "🇧🇷"
                                        : "💱"}{" "}
                              {transaction.currency}
                            </TableCell>
                            <TableCell>{transaction.description}</TableCell>
                          </TableRow>
                        ))}
                    {selectedClosingId && getTransactionsForClosing(selectedClosingId).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4">
                          No hay transacciones registradas para este cierre.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                <div className="mt-6 p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Resumen de Transacciones</h4>
                  {selectedClosingId && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Totales por Moneda</p>
                          <div className="space-y-2">
                            {Array.from(
                              new Set(getTransactionsForClosing(selectedClosingId).map((t) => t.currency)),
                            ).map((currency) => {
                              const total = getTransactionsForClosing(selectedClosingId)
                                .filter((t) => t.currency === currency)
                                .reduce((sum, t) => sum + t.amount, 0)

                              const symbol =
                                currency === "GUARANI"
                                  ? "₲"
                                  : currency === "REAL"
                                    ? "R$"
                                    : currency === "USD" || currency === "USDT"
                                      ? "$"
                                      : "$"

                              const icon =
                                currency === "ARS"
                                  ? "🇦🇷"
                                  : currency === "ARS_TRANSFER"
                                    ? "🏦"
                                    : currency === "USD"
                                      ? "💰"
                                      : currency === "USDT"
                                        ? "🪙"
                                        : currency === "GUARANI"
                                          ? "🇵🇾"
                                          : currency === "REAL"
                                            ? "🇧🇷"
                                            : "💱"

                              return (
                                <div key={currency} className="flex justify-between items-center border-b pb-1">
                                  <span>
                                    {icon} {currency}:
                                  </span>
                                  <span
                                    className={total >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}
                                  >
                                    {symbol}
                                    {Math.abs(total).toLocaleString()}
                                    {total < 0 ? " (-)" : ""}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Estadísticas</p>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center border-b pb-1">
                              <span>Total Transacciones:</span>
                              <span className="font-medium">{getTransactionsForClosing(selectedClosingId).length}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-muted-foreground text-center">
                          Datos actualizados al {format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
