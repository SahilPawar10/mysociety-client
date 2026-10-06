import { accounts } from "./accounts";
import { billing } from "./billing";
import { common } from "./common";
import { crud } from "./crud";
import { portal } from "./portal";
import { units } from "./units";

export const mr: Record<string, string> = { ...common, ...portal, ...crud, ...units, ...billing, ...accounts };
