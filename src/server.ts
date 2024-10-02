import { App } from "@/app";
import { validateEnv } from "@/utils/validate-env";
import { EventRoute } from "@/routes/event.route";
import { BookingRoute } from "@/routes/booking.route";

validateEnv();

const app = new App([new EventRoute(), new BookingRoute()]);

app.listen();
