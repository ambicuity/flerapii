/**
 * Octopus  ManagedSiteChannel
 *  ManagedSiteChannel  Octopus
 *
 *  ManagedSiteChannel  _octopusData
 */
import type { NewApiChannel } from "./newApi"
import type { OctopusChannel } from "./octopus"

export { CHANNEL_MODE, CHANNEL_STATUS } from "./newApi"

export type {
  ChannelDefaults,
  ChannelFormData,
  ChannelMode,
  ChannelModel,
  ChannelGroup,
  ChannelStatus,
  CreateChannelPayload,
  UpdateChannelPayload,
  NewApiChannelListData,
} from "./newApi"

export type {
  NewApiChannel as ManagedSiteChannel,
  NewApiChannelListData as ManagedSiteChannelListData,
} from "./newApi"

export type OctopusChannelWithData = NewApiChannel & {
  /**  Octopus  () */
  _octopusData: OctopusChannel
}
