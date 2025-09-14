import { Link } from "wouter";
import LocationCard from "./LocationCard";
import type { Location } from "@shared/schema";

interface TimelineProps {
  locations: Location[];
}

export default function Timeline({ locations }: TimelineProps) {
  return (
    <div className="relative timeline-line" data-testid="timeline">
      <div className="space-y-12">
        {locations.map((location, index) => (
          <div key={location.id} className="flex flex-col md:flex-row items-center relative" data-testid={`timeline-item-${location.slug}`}>
            {/* Timeline dot */}
            <div className="w-4 h-4 bg-primary rounded-full absolute left-4 md:left-1/2 transform md:-translate-x-1/2 z-10"></div>
            
            {/* Alternating layout */}
            {index % 2 === 0 ? (
              <>
                <div className="w-full md:w-5/12 md:pr-8 ml-12 md:ml-0">
                  <Link href={`/location/${location.slug}`}>
                    <LocationCard location={location} variant="timeline" />
                  </Link>
                </div>
                <div className="hidden md:block w-2/12"></div>
                <div className="w-full md:w-5/12"></div>
              </>
            ) : (
              <>
                <div className="w-full md:w-5/12"></div>
                <div className="hidden md:block w-2/12"></div>
                <div className="w-full md:w-5/12 md:pl-8 ml-12 md:ml-0">
                  <Link href={`/location/${location.slug}`}>
                    <LocationCard location={location} variant="timeline" />
                  </Link>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
