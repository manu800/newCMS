import { AdBlock } from "@/components/ad-block";
import { Banner } from "@/components/banner";
import { BottomNavigation } from "@/components/bottom-navigation";
import { CategoryBlock } from "@/components/category-block";
import { Carousel } from "@/components/carousel";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { ImageBlock } from "@/components/image-block";
import { NewsCard } from "@/components/news-card";
import { NewsGrid } from "@/components/news-grid";
import { NewsList } from "@/components/news-list";
import { Spacer } from "@/components/spacer";
import { TextBlock } from "@/components/text-block";
import type { PwaComponentProps } from "@/components/types";
import { Video } from "@/components/video";
import type { ComponentType } from "@cms-pwa/shared-types";

export const componentRegistry: Record<ComponentType, React.ComponentType<PwaComponentProps>> = {
  hero: Hero,
  banner: Banner,
  news_card: NewsCard,
  news_list: NewsList,
  news_grid: NewsGrid,
  carousel: Carousel,
  video: Video,
  image: ImageBlock,
  text: TextBlock,
  category: CategoryBlock,
  ad: AdBlock,
  spacer: Spacer,
  header: Header,
  footer: Footer,
  bottom_navigation: BottomNavigation,
};
