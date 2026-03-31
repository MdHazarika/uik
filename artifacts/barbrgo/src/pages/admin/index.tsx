import { 
  useGetAdminStats, getGetAdminStatsQueryKey,
  useGetAdminRevenue, getGetAdminRevenueQueryKey,
  useGetAdminBookings, getGetAdminBookingsQueryKey,
  useGetAdminUsers, getGetAdminUsersQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Scissors, CalendarCheck, TrendingUp, DollarSign, Activity } from "lucide-react";
import { format } from "date-fns";

export default function AdminPanel() {
  const { data: stats, isLoading: isStatsLoading } = useGetAdminStats({
    query: { queryKey: getGetAdminStatsQueryKey() }
  });

  const { data: revenue, isLoading: isRevenueLoading } = useGetAdminRevenue({ period: "month" }, {
    query: { queryKey: getGetAdminRevenueQueryKey({ period: "month" }) }
  });

  const { data: bookingsData } = useGetAdminBookings({ limit: 10 }, {
    query: { queryKey: getGetAdminBookingsQueryKey({ limit: 10 }) }
  });

  const { data: usersData } = useGetAdminUsers({ limit: 10 }, {
    query: { queryKey: getGetAdminUsersQueryKey({ limit: 10 }) }
  });

  return (
    <div className="container mx-auto px-4 py-8 bg-muted/10 min-h-screen">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
            <Activity className="h-8 w-8 text-accent" />
            Platform Overview
          </h1>
          <p className="text-muted-foreground mt-1">Admin dashboard and metrics</p>
        </div>
      </div>

      {isStatsLoading || !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                  <h3 className="text-3xl font-bold text-primary">${stats.totalRevenue.toLocaleString()}</h3>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <DollarSign className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-green-600">
                <TrendingUp className="h-4 w-4 mr-1" /> +{stats.growthRate}% this month
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Bookings</p>
                  <h3 className="text-3xl font-bold text-primary">{stats.totalBookings.toLocaleString()}</h3>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <CalendarCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                {stats.todayBookings} today
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Active Barbers</p>
                  <h3 className="text-3xl font-bold text-primary">{stats.totalBarbers.toLocaleString()}</h3>
                </div>
                <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <Scissors className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                In {stats.totalShops} shops
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                  <h3 className="text-3xl font-bold text-primary">{stats.totalUsers.toLocaleString()}</h3>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                Across all roles
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Area: Revenue Chart Placeholder + Tables */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle>Revenue Overview (This Month)</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isRevenueLoading ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <div className="h-[250px] w-full flex items-end justify-between gap-2 pb-6 px-2 border-b border-border">
                  {/* Pseudo-chart using raw divs to avoid extra dependencies */}
                  {revenue?.breakdown.map((item, i) => {
                    const max = Math.max(...revenue.breakdown.map(b => b.revenue));
                    const height = max > 0 ? (item.revenue / max) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full bg-primary/20 rounded-t-sm relative group-hover:bg-primary transition-colors" style={{ height: `${height}%`, minHeight: '4px' }}>
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            ${item.revenue}
                          </div>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter truncate w-full text-center overflow-hidden">{item.label.substring(0,3)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle>Recent Bookings</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 font-medium">ID</th>
                    <th className="px-6 py-3 font-medium">Customer</th>
                    <th className="px-6 py-3 font-medium">Barber</th>
                    <th className="px-6 py-3 font-medium">Amount</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {bookingsData?.bookings.map((booking) => (
                    <tr key={booking.id} className="bg-card hover:bg-muted/20">
                      <td className="px-6 py-4 font-mono">#{booking.id}</td>
                      <td className="px-6 py-4 font-medium">{booking.userName}</td>
                      <td className="px-6 py-4">{booking.barberName}</td>
                      <td className="px-6 py-4 font-medium text-accent">${booking.finalAmount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(booking.createdAt), 'MMM d, yyyy')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Sidebar: Recent Users */}
        <div className="space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle>Newest Users</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {usersData?.users.map(u => (
                  <div key={u.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary text-primary flex items-center justify-center font-bold text-sm">
                        {u.avatar ? <img src={u.avatar} className="rounded-full" alt="" /> : u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-md font-bold ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'barber' ? 'bg-accent/20 text-accent-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
