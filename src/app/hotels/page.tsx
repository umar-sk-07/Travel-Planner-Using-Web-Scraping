"use client";


import { useAppStore } from "@/store";
import { USER_API_ROUTES } from "@/utils/api-routes";
import { Button } from "@nextui-org/react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import React from "react";
import { FaChevronLeft } from "react-icons/fa";

const Hotels = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date");
  const { scrapedHotels, userInfo } = useAppStore();

  const bookHotel = async (hotelId: number) => {
    const isoDate = date
      ? new Date(date).toISOString()
      : new Date().toISOString();

    const response = await axios.post(USER_API_ROUTES.CREATE_BOOKING, {
      bookingId: hotelId,
      bookingType: "hotels",
      userId: userInfo?.id,
      taxes: 30,
      date: isoDate,
    });

    if (response.data.client_secret) {
      router.push(`/checkout?client_secret=${response.data.client_secret}`);
    }
  };
  return (
    <div className="m-10 px-[5vw] min-h-[80vh]">
      <Button
        className="my-5"
        variant="shadow"
        color="primary"
        size="lg"
        onClick={() => router.push("/search-hotels")}
      >
        <FaChevronLeft />
        Go Back
      </Button>
      <div className=" flex flex-col gap-5">
        {scrapedHotels.length === 0 && (
          <div className="flex items-center justify-center mt-10   py-5 px-10 rounded-lg text-red-500 bg-red-100 font-medium">
            No Hotels Found
          </div>
        )}
        {scrapedHotels.length !== 0 && (
          <div>
            <div className="grid grid-cols-2 gap-5">
              {scrapedHotels.map((hotel) => {
                const imageUrl = normalizeHotelImageUrl(hotel.image);
                return (
                  <div
                    key={hotel.id}
                    className="grid grid-cols-9 gap-5 rounded-2xl border border-neutral-300"
                  >
                    <div className="relative w-full h-48 col-span-3 overflow-hidden rounded-2xl bg-neutral-100">
                      <img
                        src={imageUrl}
                        alt="hotel"
                        className="h-full w-full object-cover rounded-2xl"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_HOTEL_IMAGE) {
                            target.src = FALLBACK_HOTEL_IMAGE;
                          }
                        }}
                      />
                    </div>
                    <div className="col-span-6 pt-5 pr-5 flex flex-col gap-2">
                      <h3 className="text-lg font-medium capitalize line-clamp-1">
                        {hotel.name}
                      </h3>
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        Stay in {capitalizeText(String(hotel.location))} with
                        handpicked Yatra options for your trip.
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-neutral-600">
                          <strong className="text-black">₹{hotel.price}</strong> / night
                        </span>
                        <span className="text-xs bg-danger-100 text-danger-600 px-2 py-1 rounded-full capitalize">
                          {String(hotel.location)}
                        </span>
                      </div>
                      <Button
                        size="md"
                        variant="shadow"
                        color="danger"
                        className="mt-1 w-fit"
                        onClick={() => userInfo && bookHotel(hotel.id)}
                      >
                        {!userInfo ? "Login to Book Now" : "Book Now"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Hotels;

const FALLBACK_HOTEL_IMAGE =
  "https://imgcld.yatra.com/ytimages/image/upload/t_hotel_yatra_details_desktop/v1466824037/Hotel/Delhi/00012994/Facade_o8qt6n.jpg";

function normalizeHotelImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) return FALLBACK_HOTEL_IMAGE;
  const trimmed = rawUrl.trim();
  if (!trimmed) return FALLBACK_HOTEL_IMAGE;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return FALLBACK_HOTEL_IMAGE;
}

function capitalizeText(value: string): string {
  return value
    .split(" ")
    .map((v) => (v ? `${v[0].toUpperCase()}${v.slice(1).toLowerCase()}` : v))
    .join(" ");
}
