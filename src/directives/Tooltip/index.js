import { VTooltip } from 'v-tooltip'
import './index.scss'

VTooltip.options.defaultClass = `v-${SCOPE_VERSION}`

/**
 * @vuepress
 * ---
 * title: Tooltip
 * ---
 */

/**
 * ::: tip
 * The tooltip directive is based on v-tooltip. For a full feature list see the projects [README](https://github.com/Akryum/v-tooltip/blob/master/README.md#directive)
 * :::
 * 
 * 
 * 
 * 
 * 
In the template, use the `v-tooltip` directive:

```html
<button v-tooltip="'You have ' + count + ' new messages.'">
```

Of course, you can use a reactive property:

```html
<button v-tooltip="tooltipContent">
```

You can specify the tooltip position as a modifier:

```html
<button v-tooltip.bottom-start="'You have ' + count + ' new messages.'">
```

The available positions are:

 - `'auto'`
 - `'auto-start'`
 - `'auto-end'`
 - `'top'`
 - `'top-start'`
 - `'top-end'`
 - `'right'`
 - `'right-start'`
 - `'right-end'`
 - `'bottom'`
 - `'bottom-start'`
 - `'bottom-end'`
 - `'left'`
 - `'left-start'`
 - `'left-end'`

 * 
 * <VueCodeExample title="Show tooltip">
 *    ``` vue
 *    <button v-tooltip="'I\'m a tooltip'">I'm a button with a tooltip</button>
 *    ```
 * </VueCodeExample>
 */
export const directive = VTooltip
export default directive
