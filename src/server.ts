import "reflect-metadata";
import { App } from "@/app";
import { validateEnv } from "@/utils/validate-env";
import { AuthRoute } from "@/routes/auth.route";
import { EventRoute } from "@/routes/event.route";
import { BookingRoute } from "@/routes/booking.route";

validateEnv();

const app = new App([new AuthRoute(), new EventRoute(), new BookingRoute()]);

app.listen();
