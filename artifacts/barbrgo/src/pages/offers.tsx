import { useGetOffers, getGetOffersQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Scissors, Tag, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Offers() {
  const { data: offers, isLoading } = useGetOffers({
    query: {
      queryKey: getGetOffersQueryKey()
    }
  });

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <div className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <Tag className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Current Offers</h1>
          <p className="text-primary-foreground/80 text-lg">
            Save on your next grooming session with these exclusive deals. Apply the code during checkout.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-[-2rem] relative z-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
          </div>
        ) : !offers?.length ? (
          <div className="text-center py-20 bg-background rounded-xl border border-border shadow-sm">
            <Scissors className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">No active offers</h3>
            <p className="text-muted-foreground">Check back later for new deals and discounts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="border-border shadow-md overflow-hidden relative group">
                <div className="absolute -right-10 -top-10 h-32 w-32 bg-accent/10 rounded-full blur-2xl transition-all group-hover:bg-accent/20" />
                <CardContent className="p-6 flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <Badge variant="secondary" className="bg-primary text-primary-foreground font-mono text-sm tracking-wider uppercase px-3 py-1">
                      {offer.code}
                    </Badge>
                    <div className="text-2xl font-bold text-accent">
                      {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `$${offer.discountValue}`}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-primary mb-2">{offer.description}</h3>
                  
                  <div className="mt-auto pt-6 space-y-2">
                    {offer.minBookingAmount && (
                      <p className="text-sm text-muted-foreground">Min. spend: ${offer.minBookingAmount}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Valid until {new Date(offer.validUntil || '').toLocaleDateString()}
                    </p>
                    
                    <button 
                      onClick={() => copyToClipboard(offer.code)}
                      className="w-full mt-4 py-2 rounded-md bg-secondary text-primary font-medium text-sm flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
                    >
                      {copiedCode === offer.code ? (
                        <><Check className="h-4 w-4" /> Copied!</>
                      ) : (
                        <><Copy className="h-4 w-4" /> Copy Code</>
                      )}
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
