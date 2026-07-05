import type { FC, PropsWithChildren } from 'hono/jsx'
import { Layout, Card, Wordmark, FootTag } from './layout'

/** Minimal single-message page (mute confirmations, key errors). */
export const Notice: FC<PropsWithChildren<{ title: string }>> = ({ title, children }) => (
  <Layout meta={{ title }}>
    <Wordmark />
    <Card center>{children}</Card>
    <FootTag />
  </Layout>
)
