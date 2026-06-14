import { BaseRepository } from "../../repositories/base.repository";
import { SavedPlace } from "./saved-place.schema";
import type { ISavedPlace } from "./saved-place.interface";

export class SavedPlaceRepository extends BaseRepository<ISavedPlace> {
  constructor() {
    super(SavedPlace);
  }
}
