import type { ClientModule } from 'claude-code'

type HitProps = { id: string; rows: number; hoverColor: string }
type HitState = { isHovered: boolean }

/**
 * A transparent region laid over a whole roster row: it tints under the pointer and posts
 * `{ pick: id }` on a left click, so the avatar and every line of the row open its detail.
 */
const RowHit: ClientModule<HitProps, HitState> = (props, surface) => {
  if (surface.state === undefined) {
    surface.setState({ isHovered: false })
    surface.onPointer(event => {
      if (event.type === 'enter') surface.setState({ isHovered: true })
      else if (event.type === 'leave') surface.setState({ isHovered: false })
      else if (event.type === 'down' && event.button === 'left') surface.post({ pick: props.id })
    })
  }
  const { Box } = surface.elements
  return (
    <Box width="100%" height={props.rows}
      backgroundColor={surface.state?.isHovered ? props.hoverColor : undefined} />
  )
}

export default RowHit
