<!--
  - @copyright Copyright (c) 2018 Julius Härtl <jus@bitgrid.net>
  -
  - @author Julius Härtl <jus@bitgrid.net>
  -
  - @license GNU AGPL version 3 or any later version
  -
  - This program is free software: you can redistribute it and/or modify
  - it under the terms of the GNU Affero General Public License as
  - published by the Free Software Foundation, either version 3 of the
  - License, or (at your option) any later version.
  -
  - This program is distributed in the hope that it will be useful,
  - but WITHOUT ANY WARRANTY; without even the implied warranty of
  - MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  - GNU Affero General Public License for more details.
  -
  - You should have received a copy of the GNU Affero General Public License
  - along with this program. If not, see <http://www.gnu.org/licenses/>.
  -
  -->

<template>
	<div v-tooltip="tooltip" v-click-outside="closeMenu"
		:class="{ 'icon-loading': loadingState, 'unknown': userDoesNotExist }"
		:style="avatarStyle"
		class="avatardiv popovermenu-wrapper" @click="toggleMenu">
		<img v-if="!loadingState && !userDoesNotExist" :src="avatarUrlLoaded" :srcset="avatarSrcSetLoaded">
		<div v-if="userDoesNotExist" class="unknown">
			{{ initials }}
		</div>
		<div v-show="contactsMenuOpenState" class="popovermenu">
			<popover-menu :is-open="contactsMenuOpenState" :menu="menu" />
		</div>
	</div>
</template>

<script>

/* global OC oc_userconfig */

import Tooltip from 'Directives/Tooltip'
import { PopoverMenu } from 'Components/PopoverMenu'
import ClickOutside from 'vue-click-outside'
import axios from 'nextcloud-axios'
import uidToColor from './uidToColor'

export default {
	name: 'Avatar',
	directives: {
		tooltip: Tooltip,
		ClickOutside: ClickOutside
	},
	components: {
		PopoverMenu
	},
	props: {
		/**
		 * Set a custom url to the avatar image
		 * either the url, user or displayName property must be defined
		 */
		url: {
			type: String,
			default: undefined
		},
		/**
		 * Set the user id to fetch the avatar
		 * either the url, user or displayName property must be defined
		 */
		user: {
			type: String,
			default: undefined
		},
		/**
		 * Set a display name that will be rendered as a tooltip
		 * either the url, user or displayName property must be defined
		 * specify just the displayname to generate a placeholder avatar without
		 * trying to fetch the avatar based on the user id
		 */
		displayName: {
			type: String,
			default: undefined
		},
		/**
		 * Set a size in px for the rendered avatar
		 */
		size: {
			type: Number,
			default: 32
		},
		/**
		 * Placeholder avatars will be automatically generated when this is set to true
		 */
		allowPlaceholder: {
			type: Boolean,
			default: true
		},
		/**
		 * Disable the tooltip
		 */
		disableTooltip: {
			type: Boolean,
			default: false
		},
		/**
		 * Declares a custom tooltip when not null
		 * Fallback will be the displayName
		 *
		 * requires disableTooltip not to be set to true
		 */
		tooltipMessage: {
			type: String,
			default: null
		},
		/**
		 * Declares username is not a user's name, when true.
		 * Prevents loading user's avatar from server and forces generating colored initials,
		 * i.e. if the user is a group
		 */
		isNoUser: {
			type: Boolean,
			default: false
		}
	},
	data() {
		return {
			avatarUrlLoaded: null,
			avatarSrcSetLoaded: null,
			userDoesNotExist: false,
			loadingState: true,
			contactsMenuActions: [],
			contactsMenuOpenState: false
		}
	},
	computed: {
		getUserIdentifier() {
			if (this.isDisplayNameDefined) {
				return this.displayName
			}
			if (this.isUserDefined) {
				return this.user
			}
			return ''
		},
		isUserDefined() {
			return typeof this.user !== 'undefined'
		},
		isDisplayNameDefined() {
			return typeof this.displayName !== 'undefined'
		},
		isUrlDefined() {
			return typeof this.url !== 'undefined'
		},
		shouldShowPlaceholder() {
			return this.allowPlaceholder && (
				this.userDoesNotExist)
		},
		avatarStyle() {
			let style = {
				width: this.size + 'px',
				height: this.size + 'px',
				lineHeight: this.size + 'px',
				fontSize: Math.round(this.size * 0.55) + 'px'
			}

			if (!this.shouldShowPlaceholder) {
				return style
			}

			const rgb = uidToColor(this.getUserIdentifier)
			style.backgroundColor = 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')'
			return style
		},
		tooltip() {
			if (this.disableTooltip) {
				return false
			}
			if (this.tooltipMessage) {
				return this.tooltipMessage
			}

			return this.displayName
		},
		initials() {
			if (this.shouldShowPlaceholder) {
				return this.getUserIdentifier.charAt(0).toUpperCase()
			}
			return '?'
		},
		menu() {
			return this.contactsMenuActions.map((item) => {
				return {
					href: item.hyperlink,
					icon: item.icon,
					text: item.title
				}
			})
		}
	},
	watch: {
		url() {
			this.userDoesNotExist = false
			this.loadAvatarUrl()
		},
		user() {
			this.userDoesNotExist = false
			this.loadAvatarUrl()
		}
	},
	mounted() {
		this.loadAvatarUrl()
	},
	methods: {
		toggleMenu() {
			if (this.user === OC.getCurrentUser().uid || this.userDoesNotExist || this.url) {
				return
			}
			this.contactsMenuOpenState = !this.contactsMenuOpenState
			if (this.contactsMenuOpenState) {
				this.fetchContactsMenu()
			}
		},
		closeMenu() {
			this.contactsMenuOpenState = false
		},
		fetchContactsMenu() {
			axios.post(OC.generateUrl('contactsmenu/findOne'), 'shareType=0&shareWith=' + encodeURIComponent(this.user)).then((response) => {
				this.contactsMenuActions = [response.data.topAction].concat(response.data.actions)
			}).catch(() => {
				this.contactsMenuOpenState = false
			})
		},
		loadAvatarUrl() {
			this.loadingState = true

			/** Only run avatar image loading if either user or url property is defined */
			if (!this.isUrlDefined && (!this.isUserDefined || this.isNoUser)) {
				this.loadingState = false
				this.userDoesNotExist = true
				return
			}

			const urlGenerator = (user, size) => {
				let avatarUrl = OC.generateUrl(
					'/avatar/{user}/{size}',
					{
						user: user,
						size: size
					})
				// eslint-disable-next-line camelcase
				if (user === OC.getCurrentUser().uid && typeof oc_userconfig !== 'undefined') {
					avatarUrl += '?v=' + oc_userconfig.avatar.version
				}

				return avatarUrl
			}

			let avatarUrl = urlGenerator(this.user, this.size)
			if (this.isUrlDefined) {
				avatarUrl = this.url
			}

			const srcset = [
				avatarUrl + ' 1x',
				urlGenerator(this.user, this.size * 2) + ' 2x',
				urlGenerator(this.user, this.size * 4) + ' 4x'
			].join(', ')

			let img = new Image()
			img.onload = () => {
				this.avatarUrlLoaded = avatarUrl
				if (!this.isUrlDefined) {
					this.avatarSrcSetLoaded = srcset
				}
				this.loadingState = false
			}
			img.onerror = () => {
				this.userDoesNotExist = true
				this.loadingState = false
			}

			if (!this.isUrlDefined) {
				img.srcset = srcset
			}
			img.src = avatarUrl
		}
	}
}
</script>

<style scoped>
	.avatardiv {
		display: inline-block;
	}

	.avatardiv.unknown {
		background-color: var(--color-text-maxcontrast);
		position: relative;
	}

	.avatardiv > .unknown {
		position: absolute;
		color: var(--color-main-background);
		width: 100%;
		text-align: center;
		display: block;
		left: 0;
		top: 0;
	}

	.avatardiv img {
		width: 100%;
		height: 100%;
	}

	.popovermenu-wrapper {
		position: relative;
		display: inline-block;
	}

	.popovermenu {
		display: block;
		margin: 0;
		font-size: initial;
	}
</style>
