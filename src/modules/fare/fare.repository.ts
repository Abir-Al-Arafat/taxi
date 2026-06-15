// src/modules/fare/fare.repository.ts
import { BaseRepository } from "../../repositories/base.repository";
import { FareRule } from "./fare.schema";
import type { IFareRule } from "./fare.interface";

export class FareRepository extends BaseRepository<IFareRule> {
  constructor() {
    super(FareRule);
  }
}
