"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    MapPin,
    Car,
    Bike,
    Zap,
    Search,
    X,
    Clock,
    Users,
    Route,
    Navigation,
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import dynamic from "next/dynamic";

const RideMap = dynamic(() => import("../components/RideMap"), {
    ssr: false,
    loading: () => (
        <div className="flex h-full items-center justify-center bg-gray-100">
            <p className="text-sm text-gray-500">
                Loading map...
            </p>
        </div>
    ),
});

type VehicleType = "car" | "ev" | "bike";

interface Vehicle {
    id: number;
    type: VehicleType;
    lat: number;
    lng: number;
    name: string;
    seats: number;
    eta: number;
}

/*
 * OSRM returns GeoJSON coordinates as:
 *
 * [longitude, latitude]
 *
 * Leaflet Polyline needs:
 *
 * [latitude, longitude]
 */
type RoutePoint = [number, number];

const VEHICLE_PRICES: Record<VehicleType, number> = {
    bike: 100,
    car: 400,
    ev: 400,
};

const vehicles: Vehicle[] = [
    {
        id: 1,
        type: "car",
        lat: 27.6915,
        lng: 83.455,
        name: "Standard Car",
        seats: 4,
        eta: 3,
    },
    {
        id: 2,
        type: "ev",
        lat: 27.698,
        lng: 83.448,
        name: "EV Green",
        seats: 4,
        eta: 5,
    },
    {
        id: 3,
        type: "bike",
        lat: 27.686,
        lng: 83.442,
        name: "City Bike",
        seats: 1,
        eta: 2,
    },
    {
        id: 4,
        type: "car",
        lat: 27.704,
        lng: 83.46,
        name: "Comfort Sedan",
        seats: 4,
        eta: 6,
    },
];

export default function Page() {
    const [userCoords, setUserCoords] = useState<
        [number, number]
    >([27.700769, 83.448349]);

    const [userAddress, setUserAddress] =
        useState("Current Location");

    const [destinationCoords, setDestinationCoords] =
        useState<[number, number] | null>(null);

    const [destinationName, setDestinationName] =
        useState("");

    const [searchText, setSearchText] =
        useState("");

    const [searching, setSearching] =
        useState(false);

    const [loadingLocation, setLoadingLocation] =
        useState(false);

    const [selectedType, setSelectedType] =
        useState<VehicleType | "all">("all");

    const [selectedVehicleType, setSelectedVehicleType] =
        useState<VehicleType | null>(null);

    const [roadDistance, setRoadDistance] =
        useState<number | null>(null);

    const [roadDuration, setRoadDuration] =
        useState<number | null>(null);

    /*
     * Actual road geometry.
     *
     * Leaflet format:
     * [[lat, lng], [lat, lng], ...]
     */
    const [routeCoordinates, setRouteCoordinates] =
        useState<RoutePoint[]>([]);

    const [calculatingRoute, setCalculatingRoute] =
        useState(false);

    const [requestingRide, setRequestingRide] =
        useState(false);

    /*
     * Get address from coordinates
     */
    const getPlaceName = async (
        lat: number,
        lng: number
    ) => {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );

            if (!response.ok) {
                throw new Error(
                    "Reverse geocoding failed"
                );
            }

            const data = await response.json();

            return (
                data.display_name ||
                "Selected Location"
            );
        } catch (error) {
            console.error(
                "Reverse geocoding failed:",
                error
            );

            return "Selected Location";
        }
    };

    /*
     * ---------------------------------------------------------
     * GET ACTUAL ROAD ROUTE
     * ---------------------------------------------------------
     *
     * OSRM:
     *
     * pickup:
     * longitude,latitude
     *
     * destination:
     * longitude,latitude
     *
     * response:
     * GeoJSON LineString
     */
    const calculateRoadRoute = async (
        pickup: [number, number],
        destination: [number, number]
    ) => {
        try {
            setCalculatingRoute(true);

            /*
             * Leaflet:
             *
             * [latitude, longitude]
             */
            const [pickupLat, pickupLng] =
                pickup;

            const [
                destinationLat,
                destinationLng,
            ] = destination;

            /*
             * OSRM requires:
             *
             * longitude,latitude
             */
            const url =
                `https://router.project-osrm.org/route/v1/driving/` +
                `${pickupLng},${pickupLat};` +
                `${destinationLng},${destinationLat}` +
                `?overview=full&geometries=geojson&steps=false`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    "Route request failed"
                );
            }

            const data = await response.json();

            if (
                data.code !== "Ok" ||
                !data.routes ||
                data.routes.length === 0
            ) {
                throw new Error(
                    "No road route found"
                );
            }

            const route = data.routes[0];

            /*
             * Distance from actual road
             */
            const distanceKm =
                route.distance / 1000;

            /*
             * Duration from actual road
             */
            const durationMinutes = Math.ceil(
                route.duration / 60
            );

            /*
             * OSRM GeoJSON:
             *
             * [
             *   [lng, lat],
             *   [lng, lat],
             *   ...
             * ]
             *
             * Convert it to Leaflet:
             *
             * [
             *   [lat, lng],
             *   [lat, lng],
             *   ...
             * ]
             */
            const coordinates =
                route.geometry.coordinates.map(
                    (
                        point: [number, number]
                    ) => [
                        point[1],
                        point[0],
                    ]
                );

            setRouteCoordinates(
                coordinates
            );

            setRoadDistance(
                Number(
                    distanceKm.toFixed(2)
                )
            );

            setRoadDuration(
                durationMinutes
            );

            return {
                distanceKm:
                    Number(
                        distanceKm.toFixed(
                            2
                        )
                    ),

                durationMinutes,

                coordinates,
            };
        } catch (error) {
            console.error(
                "Road route calculation failed:",
                error
            );

            setRouteCoordinates([]);
            setRoadDistance(null);
            setRoadDuration(null);

            alert(
                "Unable to find a road route between these locations."
            );
        } finally {
            setCalculatingRoute(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * CURRENT LOCATION
     * ---------------------------------------------------------
     */

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert(
                "Geolocation is not supported by your browser."
            );

            return;
        }

        setLoadingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const coords: [
                    number,
                    number
                ] = [
                    position.coords.latitude,
                    position.coords.longitude,
                ];

                setUserCoords(coords);

                const address =
                    await getPlaceName(
                        coords[0],
                        coords[1]
                    );

                setUserAddress(address);

                /*
                 * Recalculate actual road route
                 * if destination already exists.
                 */
                if (destinationCoords) {
                    await calculateRoadRoute(
                        coords,
                        destinationCoords
                    );
                }

                setLoadingLocation(false);
            },
            () => {
                setLoadingLocation(false);

                alert(
                    "Unable to get your current location."
                );
            }
        );
    };

    /*
     * ---------------------------------------------------------
     * SEARCH DESTINATION
     * ---------------------------------------------------------
     */

    const handleSearch = async () => {
        if (!searchText.trim()) {
            return;
        }

        setSearching(true);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchText
                )}`
            );

            const data =
                await response.json();

            if (!data.length) {
                alert(
                    "Location not found."
                );

                return;
            }

            const location: [
                number,
                number
            ] = [
                Number(data[0].lat),
                Number(data[0].lon),
            ];

            setDestinationCoords(
                location
            );

            setDestinationName(
                data[0].display_name
            );

            setSelectedVehicleType(
                null
            );

            /*
             * Calculate actual road
             * route.
             */
            await calculateRoadRoute(
                userCoords,
                location
            );
        } catch (error) {
            console.error(
                "Search failed:",
                error
            );

            alert(
                "Unable to search location."
            );
        } finally {
            setSearching(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * MAP CLICK DESTINATION
     * ---------------------------------------------------------
     */

    const handleMapClick = async (
        lat: number,
        lng: number
    ) => {
        const destination: [
            number,
            number
        ] = [lat, lng];

        setDestinationCoords(
            destination
        );

        setDestinationName(
            "Fetching address..."
        );

        setSelectedVehicleType(
            null
        );

        /*
         * Get destination address
         */
        const address =
            await getPlaceName(
                lat,
                lng
            );

        setDestinationName(
            address
        );

        /*
         * Get actual road route
         */
        await calculateRoadRoute(
            userCoords,
            destination
        );
    };

    /*
     * ---------------------------------------------------------
     * CLEAR DESTINATION
     * ---------------------------------------------------------
     */

    const clearDestination = () => {
        setSearchText("");

        setDestinationCoords(null);

        setDestinationName("");

        setRouteCoordinates([]);

        setRoadDistance(null);

        setRoadDuration(null);

        setSelectedVehicleType(
            null
        );
    };

    /*
     * ---------------------------------------------------------
     * SEARCH ENTER
     * ---------------------------------------------------------
     */

    const handleSearchKey = (
        event: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (event.key === "Enter") {
            handleSearch();
        }
    };

    /*
     * ---------------------------------------------------------
     * VEHICLE FILTER
     * ---------------------------------------------------------
     */

    const filteredVehicles =
        selectedType === "all"
            ? vehicles
            : vehicles.filter(
                  (vehicle) =>
                      vehicle.type ===
                      selectedType
              );

    /*
     * ---------------------------------------------------------
     * FARE
     * ---------------------------------------------------------
     */

    const calculateFare = (
        type: VehicleType
    ) => {
        if (!roadDistance) {
            return 0;
        }

        return Math.ceil(
            roadDistance *
                VEHICLE_PRICES[type]
        );
    };

    /*
     * ---------------------------------------------------------
     * CONFIRM RIDE
     * ---------------------------------------------------------
     */

    const handleConfirmRide = async () => {
        if (
            !destinationCoords ||
            !selectedVehicleType ||
            !roadDistance
        ) {
            return;
        }

        const estimatedFare =
            calculateFare(
                selectedVehicleType
            );

        /*
         * GeoJSON format:
         *
         * [longitude, latitude]
         */
        const rideRequest = {
            pickupAddress:
                userAddress,

            pickupCoordinates: [
                userCoords[1],
                userCoords[0],
            ],

            dropoffAddress:
                destinationName,

            dropoffCoordinates: [
                destinationCoords[1],
                destinationCoords[0],
            ],

            vehicleType:
                selectedVehicleType,

            distanceKm:
                roadDistance,

            estimatedFare,
        };

        console.log(
            "RIDE REQUEST:",
            rideRequest
        );

        try {
            setRequestingRide(true);

            /*
             * Replace this with your backend:
             *
             * const response = await fetch(
             *     "/api/customer/ride-request",
             *     {
             *         method: "POST",
             *         credentials: "include",
             *         headers: {
             *             "Content-Type":
             *                 "application/json",
             *         },
             *         body: JSON.stringify(
             *             rideRequest
             *         ),
             *     }
             * );
             */

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        800
                    )
            );

            alert(
                `Ride request created!\n\n` +
                    `Vehicle: ${selectedVehicleType}\n` +
                    `Distance: ${roadDistance} km\n` +
                    `Fare: Rs. ${estimatedFare}`
            );
        } catch (error) {
            console.error(
                "Ride request failed:",
                error
            );

            alert(
                "Unable to request ride."
            );
        } finally {
            setRequestingRide(false);
        }
    };

    /*
     * ---------------------------------------------------------
     * VEHICLE DATA
     * ---------------------------------------------------------
     */

    const vehicleInformation: Record<
        VehicleType,
        {
            name: string;
            icon: string;
            seats: number;
        }
    > = {
        bike: {
            name: "Bike",
            icon: "/bike.webp",
            seats: 1,
        },

        car: {
            name: "Car",
            icon: "/car1.png",
            seats: 4,
        },

        ev: {
            name: "EV Car",
            icon: "/ev_car.webp",
            seats: 4,
        },
    };

    /*
     * ---------------------------------------------------------
     * UI
     * ---------------------------------------------------------
     */

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 text-gray-900 sm:px-6 md:px-10">
            <div className="mx-auto max-w-7xl">

                {/* HEADER */}

                <div className="mb-6">
                    <p className="mb-1 text-sm font-medium text-blue-600">
                        Yatra Ride
                    </p>

                    <h1 className="text-2xl font-bold sm:text-3xl">
                        Let's get a ride today
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Choose your pickup,
                        destination and
                        preferred vehicle.
                    </p>
                </div>

                {/* VEHICLE TYPE */}

                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(
                        [
                            "car",
                            "ev",
                            "bike",
                        ] as VehicleType[]
                    ).map((type) => {
                        const vehicle =
                            vehicleInformation[
                                type
                            ];

                        return (
                            <button
                                key={type}
                                onClick={() => {
                                    setSelectedType(
                                        type
                                    );

                                    setSelectedVehicleType(
                                        type
                                    );
                                }}
                                className={`rounded-2xl border-2 bg-white p-4 text-left transition ${
                                    selectedVehicleType ===
                                    type
                                        ? "border-blue-500 shadow-md"
                                        : "border-transparent shadow-sm hover:border-gray-200"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <Image
                                        src={
                                            vehicle.icon
                                        }
                                        alt={
                                            vehicle.name
                                        }
                                        width={120}
                                        height={70}
                                        className="h-16 w-24 object-contain"
                                    />

                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            Price/km
                                        </p>

                                        <p className="font-bold text-blue-600">
                                            Rs.{" "}
                                            {
                                                VEHICLE_PRICES[
                                                    type
                                                ]
                                            }
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold">
                                            {
                                                vehicle.name
                                            }
                                        </h3>

                                        <p className="text-xs text-gray-500">
                                            {
                                                vehicle.seats
                                            }{" "}
                                            seats
                                        </p>
                                    </div>

                                    {selectedVehicleType ===
                                        type && (
                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-600">
                                            Selected
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* PICKUP + DESTINATION */}

                <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">

                    {/* PICKUP */}

                    <div className="rounded-2xl border bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <button
                                onClick={
                                    handleCurrentLocation
                                }
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 sm:w-auto"
                            >
                                <MapPin
                                    size={18}
                                />

                                {loadingLocation
                                    ? "Locating..."
                                    : "Find my location"}
                            </button>

                            <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase text-gray-400">
                                    Pickup
                                </p>

                                <p className="truncate text-xs text-gray-600 sm:max-w-[280px]">
                                    {
                                        userAddress
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* DESTINATION */}

                    <div className="rounded-2xl border bg-white p-2 shadow-sm">
                        <div className="flex items-center">

                            <Search
                                size={20}
                                className="ml-2 shrink-0 text-gray-400"
                            />

                            <input
                                value={
                                    searchText
                                }
                                onChange={(
                                    e
                                ) =>
                                    setSearchText(
                                        e.target
                                            .value
                                    )
                                }
                                onKeyDown={
                                    handleSearchKey
                                }
                                placeholder="Where do you want to go?"
                                className="min-w-0 flex-1 px-3 py-2.5 text-sm outline-none"
                            />

                            {searchText && (
                                <button
                                    onClick={
                                        clearDestination
                                    }
                                    className="shrink-0 rounded-full p-2 hover:bg-gray-100"
                                >
                                    <X
                                        size={
                                            18
                                        }
                                    />
                                </button>
                            )}

                            <button
                                onClick={
                                    handleSearch
                                }
                                disabled={
                                    searching
                                }
                                className="shrink-0 rounded-xl bg-black px-4 py-2.5 text-sm text-white disabled:opacity-50"
                            >
                                {searching
                                    ? "Searching..."
                                    : "Search"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ROUTE INFO */}

                {destinationCoords && (
                    <div className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                            <div className="min-w-0">
                                <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                                    <Navigation
                                        size={
                                            14
                                        }
                                    />

                                    Destination
                                </div>

                                <p className="truncate text-sm font-semibold">
                                    {
                                        destinationName
                                    }
                                </p>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                                    <Route
                                        size={
                                            14
                                        }
                                    />

                                    Road Distance
                                </div>

                                <p className="text-sm font-bold">
                                    {calculatingRoute
                                        ? "Calculating..."
                                        : roadDistance
                                          ? `${roadDistance} km`
                                          : "N/A"}
                                </p>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                                    <Clock
                                        size={
                                            14
                                        }
                                    />

                                    Estimated Time
                                </div>

                                <p className="text-sm font-bold">
                                    {calculatingRoute
                                        ? "Calculating..."
                                        : roadDuration
                                          ? `${roadDuration} min`
                                          : "N/A"}
                                </p>
                            </div>

                        </div>
                    </div>
                )}

                {/* MAP */}

                <div className="relative h-[450px] w-full overflow-hidden rounded-3xl border shadow-lg sm:h-[500px]">

                    <RideMap
                        userCoords={
                            userCoords
                        }
                        destinationCoords={
                            destinationCoords
                        }
                        routeCoordinates={
                            routeCoordinates
                        }
                        filteredVehicles={
                            filteredVehicles
                        }
                        selectedVehicle={
                            null
                        }
                        setSelectedVehicle={() => {}}
                        handleMapClick={
                            handleMapClick
                        }
                    />

                    {/* MAP FILTER */}

                    <div className="absolute left-3 top-3 z-[1000] flex max-w-[calc(100%-24px)] gap-1 overflow-x-auto rounded-2xl bg-white/95 p-1.5 shadow-md">

                        <button
                            onClick={() =>
                                setSelectedType(
                                    "all"
                                )
                            }
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${
                                selectedType ===
                                "all"
                                    ? "bg-black text-white"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            All
                        </button>

                        <button
                            onClick={() =>
                                setSelectedType(
                                    "car"
                                )
                            }
                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                                selectedType ===
                                "car"
                                    ? "bg-black text-white"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            <Car
                                size={
                                    14
                                }
                            />
                            Car
                        </button>

                        <button
                            onClick={() =>
                                setSelectedType(
                                    "ev"
                                )
                            }
                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                                selectedType ===
                                "ev"
                                    ? "bg-black text-white"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            <Zap
                                size={
                                    14
                                }
                            />
                            EV
                        </button>

                        <button
                            onClick={() =>
                                setSelectedType(
                                    "bike"
                                )
                            }
                            className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                                selectedType ===
                                "bike"
                                    ? "bg-black text-white"
                                    : "hover:bg-gray-100"
                            }`}
                        >
                            <Bike
                                size={
                                    14
                                }
                            />
                            Bike
                        </button>
                    </div>

                    {/* ROUTE STATUS */}

                    {roadDistance && (
                        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
                            <div className="rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur">

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <p className="text-[10px] font-semibold uppercase text-gray-400">
                                            Actual Road Route
                                        </p>

                                        <p className="text-sm font-bold">
                                            {
                                                roadDistance
                                            }{" "}
                                            km
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock
                                            size={
                                                14
                                            }
                                        />

                                        {
                                            roadDuration
                                        }{" "}
                                        min
                                    </div>

                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* FARE OPTIONS */}

                {destinationCoords &&
                    roadDistance && (
                        <div className="mt-6">

                            <div className="mb-4">
                                <h2 className="text-lg font-bold">
                                    Choose your ride
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Fare is calculated
                                    using the actual
                                    road distance.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                                {(
                                    [
                                        "bike",
                                        "car",
                                        "ev",
                                    ] as VehicleType[]
                                ).map(
                                    (
                                        type
                                    ) => {
                                        const vehicle =
                                            vehicleInformation[
                                                type
                                            ];

                                        const fare =
                                            calculateFare(
                                                type
                                            );

                                        return (
                                            <button
                                                key={
                                                    type
                                                }
                                                onClick={() =>
                                                    setSelectedVehicleType(
                                                        type
                                                    )
                                                }
                                                className={`rounded-2xl border-2 bg-white p-5 text-left transition ${
                                                    selectedVehicleType ===
                                                    type
                                                        ? "border-blue-500 shadow-lg"
                                                        : "border-gray-100 shadow-sm hover:border-gray-300"
                                                }`}
                                            >

                                                <div className="flex items-center justify-between">

                                                    <Image
                                                        src={
                                                            vehicle.icon
                                                        }
                                                        alt={
                                                            vehicle.name
                                                        }
                                                        width={
                                                            100
                                                        }
                                                        height={
                                                            60
                                                        }
                                                        className="h-14 w-20 object-contain"
                                                    />

                                                    <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                                                        Rs.{" "}
                                                        {
                                                            VEHICLE_PRICES[
                                                                type
                                                            ]
                                                        }
                                                        /km
                                                    </span>
                                                </div>

                                                <h3 className="mt-4 text-lg font-bold">
                                                    {
                                                        vehicle.name
                                                    }
                                                </h3>

                                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                                    <Users
                                                        size={
                                                            14
                                                        }
                                                    />

                                                    {
                                                        vehicle.seats
                                                    }{" "}
                                                    seats
                                                </div>

                                                <div className="mt-4 border-t pt-4">

                                                    <p className="text-xs text-gray-500">
                                                        Estimated fare
                                                    </p>

                                                    <p className="text-2xl font-bold text-blue-600">
                                                        Rs.{" "}
                                                        {
                                                            fare
                                                        }
                                                    </p>

                                                </div>
                                            </button>
                                        );
                                    }
                                )}

                            </div>
                        </div>
                    )}

                {/* CONFIRM RIDE */}

                {selectedVehicleType &&
                    destinationCoords &&
                    roadDistance && (
                        <div className="sticky bottom-4 z-20 mt-6">

                            <div className="rounded-2xl border bg-white p-4 shadow-xl sm:p-5">

                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                                    <div>
                                        <p className="text-xs text-gray-500">
                                            Selected vehicle
                                        </p>

                                        <h3 className="text-lg font-bold">
                                            {
                                                vehicleInformation[
                                                    selectedVehicleType
                                                ].name
                                            }
                                        </h3>

                                        <p className="mt-1 text-xs text-gray-500">
                                            {
                                                roadDistance
                                            }{" "}
                                            km ·{" "}
                                            {
                                                roadDuration
                                            }{" "}
                                            min
                                        </p>
                                    </div>

                                    <div className="sm:text-right">
                                        <p className="text-xs text-gray-500">
                                            Estimated Fare
                                        </p>

                                        <p className="text-2xl font-bold text-blue-600">
                                            Rs.{" "}
                                            {calculateFare(
                                                selectedVehicleType
                                            )}
                                        </p>
                                    </div>

                                    <button
                                        onClick={
                                            handleConfirmRide
                                        }
                                        disabled={
                                            requestingRide ||
                                            calculatingRoute
                                        }
                                        className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 sm:w-auto"
                                    >
                                        {requestingRide
                                            ? "Requesting..."
                                            : "Confirm Ride"}
                                    </button>

                                </div>
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
}