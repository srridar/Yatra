"use client";

import { MapContainer,  TileLayer,  Marker,  Popup,  Polyline,  useMap,} from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

interface Vehicle {
    id: number;
    type: "car" | "ev" | "bike";
    lat: number;
    lng: number;
    name: string;
    seats: number;
    eta: number;
}

type Coordinates = [number, number];

interface RideMapProps {
    userCoords: Coordinates;
    destinationCoords: | Coordinates | null;
    routeCoordinates: Coordinates[];
    filteredVehicles: Vehicle[];
    selectedVehicle: Vehicle | null;
    setSelectedVehicle: ( vehicle: Vehicle | null) => void;

    handleMapClick: ( lat: number, lng: number) => void;
}



function RouteView({ routeCoordinates}: { routeCoordinates: Coordinates[]}) {
    const map = useMap();
    useEffect(() => {
        if ( !routeCoordinates || routeCoordinates.length === 0) {
            return;
        }
        const bounds = L.latLngBounds( routeCoordinates);
        map.fitBounds(bounds, {
            padding: [60, 60],
            maxZoom: 16,
        });
    }, [
        routeCoordinates,
        map,
    ]);

    return null;
}



function MapClickHandler({ handleMapClick}: { handleMapClick: ( lat: number, lng: number) => void}) {
    const map = useMap();

    useEffect(() => {
        const handleClick = ( event: L.LeafletMouseEvent) => {
            handleMapClick(  event.latlng.lat, event.latlng.lng );
        };
        map.on( "click", handleClick);
        return () => {
            map.off(  "click",  handleClick);
        };
    }, [
        map,
        handleMapClick,
    ]);

    return null;
}



export default function RideMap({ userCoords, destinationCoords,
    routeCoordinates, filteredVehicles, selectedVehicle,
    setSelectedVehicle, handleMapClick,}: RideMapProps) {
   

    const userIcon = L.icon({
        iconUrl: "/user.png",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
    });

    const destinationIcon =
        L.icon({
            iconUrl: "/destination.png",
            iconSize: [42, 42],
            iconAnchor: [21, 42],
        });

    const carIcon = L.icon({
        iconUrl: "/car1.png",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
    });

    const evIcon = L.icon({
        iconUrl: "/ev_car.webp",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
    });

    const bikeIcon = L.icon({
        iconUrl: "/bike.webp",
        iconSize: [42, 42],
        iconAnchor: [21, 21],
    });

    const getVehicleIcon = (  type: Vehicle["type"]) => {
        if (type === "car") {
            return carIcon;
        }

        if (type === "ev") {
            return evIcon;
        }

        return bikeIcon;
    };

    return (
        <MapContainer center={userCoords} zoom={14} scrollWheelZoom={true} className="h-full w-full">
         
            <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapClickHandler handleMapClick={ handleMapClick }/>

            <RouteView  routeCoordinates={  routeCoordinates} />
            <Marker position={userCoords}  icon={userIcon}>
                <Popup>
                    <div className="text-sm">
                        <strong>
                            Pickup Location
                        </strong>
                    </div>
                </Popup>
            </Marker>

            {destinationCoords && (
                <Marker  position={ destinationCoords } icon={ destinationIcon}>
                    <Popup>
                        <div className="text-sm">
                            <strong>
                                Destination
                            </strong>
                        </div>
                    </Popup>
                </Marker>
            )}

            {routeCoordinates.length >
                0 && (
                <Polyline
                    positions={  routeCoordinates }
                    pathOptions={{
                        color: "#2563eb",
                        weight: 6,
                        opacity: 0.9,
                        lineCap: "round",
                        lineJoin: "round",
                    }}
                />
            )}


            {filteredVehicles.map(
                (vehicle) => (
                    <Marker
                        key={vehicle.id}
                        position={[
                            vehicle.lat,
                            vehicle.lng,
                        ]}
                        icon={getVehicleIcon( vehicle.type)}
                        eventHandlers={{ click: () => setSelectedVehicle(vehicle) }}
                    >
                        <Popup>
                            <div className="min-w-[150px]">
                                <p className="font-bold">  { vehicle.name}</p>
                                <p className="text-xs text-gray-500">  { vehicle.eta}{" "} min away </p>
                                <p className="text-xs text-gray-500">  {  vehicle.seats}{" "}seats</p>
                            </div>
                        </Popup>
                    </Marker>
                )
            )}
        </MapContainer>
    );
}