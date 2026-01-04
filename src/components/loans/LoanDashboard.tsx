'use client';
import { logger } from '@/utils/logger';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { LoanList } from './LoanList';
import { LoanOffersList } from './LoanOffersList';
import { CreateLoanDialog } from './CreateLoanDialog';
import { AvailableLoans } from './AvailableLoans';
import { Plus, DollarSign, Target, TrendingUp } from 'lucide-react';
import loansService from '@/services/loans';
import { Loan, LoanOffer } from '@/types/loans';
import { toast } from 'sonner';
import CommercePagination from '@/components/commerce/CommercePagination';

export default function LoanDashboard() {
  const [myLoans, setMyLoans] = useState<Loan[]>([]);
  const [myOffers, setMyOffers] = useState<LoanOffer[]>([]);
  const [availableLoans, setAvailableLoans] = useState<Loan[]>([]);
  const [availablePage, setAvailablePage] = useState(1);
  const [availableTotal, setAvailableTotal] = useState(0);
  const availablePageSize = 12;
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [availablePage]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load user's loans
      const loansResult = await loansService.getUserLoans();
      if (loansResult.success) {
        setMyLoans(loansResult.loans || []);
      }

      // Load available loans for offering
      const availableResult = await loansService.getAvailableLoans(undefined, {
        pageSize: availablePageSize,
        offset: (availablePage - 1) * availablePageSize,
      });
      if (availableResult.success) {
        setAvailableLoans(availableResult.loans || []);
        setAvailableTotal(availableResult.total || 0);
      }

      // Load offers I've made
      const offersResult = await loansService.getUserOffers();
      if (offersResult.success) {
        setMyOffers(offersResult.offers || []);
      }

    } catch (error) {
      logger.error('Failed to load dashboard data:', error);
      toast.error('Failed to load loans data');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanCreated = () => {
    setCreateDialogOpen(false);
    loadDashboardData();
    toast.success('Loan created successfully!');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Content - Header handled by EntityListShell */}
      <Tabs defaultValue="my-loans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-loans" className="gap-2">
            <DollarSign className="h-4 w-4" />
            My Loans ({myLoans.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="gap-2">
            <Target className="h-4 w-4" />
            Available Loans ({availableLoans.length})
          </TabsTrigger>
          <TabsTrigger value="offers" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            My Offers ({myOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-loans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Loan Listings</CardTitle>
              <CardDescription>
                Loans you've listed for refinancing or payoff offers from the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myLoans.length > 0 ? (
                <LoanList loans={myLoans} onLoanUpdated={loadDashboardData} />
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No loans listed yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Add your first loan to start receiving refinancing offers from the community
                  </p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Loan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="available" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Available Loans</CardTitle>
              <CardDescription>
                Public loan listings from the community - make offers to refinance or pay them off
              </CardDescription>
            </CardHeader>
            <CardContent>
              {availableLoans.length > 0 ? (
                <>
                  <AvailableLoans loans={availableLoans} onOfferMade={loadDashboardData} />
                  <CommercePagination
                    page={availablePage}
                    limit={availablePageSize}
                    total={availableTotal}
                    onPageChange={setAvailablePage}
                  />
                </>
              ) : (
                <div className="text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No loans available</h3>
                  <p className="text-muted-foreground">
                    Check back later for community loan listings
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Loan Offers</CardTitle>
              <CardDescription>
                Offers you've made on other people's loans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myOffers.length > 0 ? (
                <LoanOffersList offers={myOffers} onOfferUpdated={loadDashboardData} />
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No offers made yet</h3>
                  <p className="text-muted-foreground">
                    Browse available loans to make your first refinancing offer
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Loan Dialog */}
      <CreateLoanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onLoanCreated={handleLoanCreated}
      />
    </div>
  );
}
