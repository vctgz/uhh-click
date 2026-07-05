import type { FC } from 'hono/jsx'
import { Layout, Card, Wordmark, FootTag } from './layout'

export const NotFound: FC = () => (
  <Layout meta={{ title: 'uhh… nothing here — uhh.click' }}>
    <Wordmark />
    <Card center>
      <h1 class="uhh-h1">
        uhh… <span class="hl">nothing here.</span>
      </h1>
      <p class="uhh-lead">that link doesn't exist, or it did and we're all pretending otherwise.</p>
      <a href="/" class="btn btn-primary">
        ← make a new one
      </a>
    </Card>
    <FootTag />
  </Layout>
)
