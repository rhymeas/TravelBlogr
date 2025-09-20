import Header from "@/components/Header";
import GlobalTripFeed from "@/components/GlobalTripFeed";

export default function LiveFeedPage() {

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950" data-testid="live-feed-page">
      <Header />
      
      {/* Page Title */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-foreground" data-testid="live-feed-title">Live Feed</h1>
          <p className="text-muted-foreground mt-1">Teile deine Reisemomente</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <GlobalTripFeed />
      </div>
    </div>
  );
}