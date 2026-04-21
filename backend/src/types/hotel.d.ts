// Define the HotelType interface that will be used for scraping
export interface HotelType {
  id: number;
  name: string;
  image: string;
  price: number;
  jobId: number;
  location: string;
  scrappedOn: string;
}
