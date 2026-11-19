import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { billingRouter } from "./routers/billing";
import { catalogRouter } from "./routers/catalog";
import { learningRouter } from "./routers/learning";
import { placementRouter } from "./routers/placement";
import { adminRouter } from "./routers/admin";
import { bookingsRouter } from "./routers/bookings";
import { homeworkRouter } from "./routers/homework";
import { chatRouter } from "./routers/chat";
import { assessmentRouter } from "./routers/assessment";
import { premiumRouter } from "./routers/premium";
import { profileRouter } from "./routers/profile";
import { curriculumRouter } from "./routers/curriculum";
import { receiptsRouter } from "./routers/receipts";
import { certificatesRouter } from "./routers/certificates";
import { communityRouter } from "./routers/community";
import { writingRouter } from "./routers/writing";
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  catalog: catalogRouter,
  learning: learningRouter,
  billing: billingRouter,
  placement: placementRouter,
  admin: adminRouter,
  bookings: bookingsRouter,
  homework: homeworkRouter,
  chat: chatRouter,
  assessment: assessmentRouter,
  premium: premiumRouter,
  profile: profileRouter,
  curriculum: curriculumRouter,
  receipts: receiptsRouter,
  certificates: certificatesRouter,
  community: communityRouter,
  writing: writingRouter,
});

export type AppRouter = typeof appRouter;
