/**
 * This module contains type definitions of models which mostly mirror those of
 * [niivue-react](https://github.com/niivue/niivue-react/blob/9128a704fc912281caf574e13897851f3471821b/src/model.ts#L70),
 * but with non-optional keys.
 */

import { NVROptions, NVRVolume } from "niivue-react/src/model.ts";

/**
 * Subset of `NVROptions` with non-optional keys.
 */
type ChNVROptions = Required<
  Pick<
    NVROptions,
    | "isColorbar"
    | "isOrientCube"
    | "isHighResolutionCapable"
    | "sliceType"
    | "dragMode"
    | "isSliceMM"
    | "backColor"
    | "multiplanarForceRender"
    | "isRadiologicalConvention"
    | "show3Dcrosshair"
    | "crosshairWidth"
  >
>;

/**
 * Niivue options for volumes which can be customized in the Visual Dataset Browser.
 *
 * This is a subset of the options supported by pl-visual-dataset, meaning some
 * configurations such as `trustCalMinCalMax` are ignored.
 *
 * https://github.com/FNNDSC/pl-visual-dataset/blob/v0.1.0/visualdataset/options.py#L9-L22
 */
type SupportedVolumeSettings = Pick<
  NVRVolume,
  "opacity" | "colormap" | "cal_min" | "cal_max" | "colorbarVisible"
>;

/**
 * Required `SupportedVolumeSettings` without `cal_max`.
 *
 * It is safe to use some default value for the properties of
 * `UsualVolumeSettings`. The reason `cal_max` is excluded is
 * that a default value for `cal_max` will make most volumes
 * look off.
 */
type UsualVolumeSettings = Required<Omit<SupportedVolumeSettings, "cal_max">>;

/**
 * Same as `SupportedVolumeSettings` but with most properties being required.
 */
type VolumeSettings = SupportedVolumeSettings & UsualVolumeSettings;

/**
 * A subset of `NVRVolume` with (mostly) non-optional keys.
 */
type ChNVRVolume = { url: string } & VolumeSettings;

export type {
  SupportedVolumeSettings,
  UsualVolumeSettings,
  VolumeSettings,
  ChNVRVolume,
  ChNVROptions,
};
