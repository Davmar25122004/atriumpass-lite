import Fastify from 'fastify'
import cors from '@fastify/cors'
import { authRoutes } from './routes/auth.js'
import { typesRoutes } from './routes/types.js'
import { instancesRoutes } from './routes/instances.js'
import { personsRoutes } from './routes/persons.js'
import { clientsRoutes } from './routes/clients.js'
import { accessPointsRoutes } from './routes/accessPoints.js'
import { accessMethodsRoutes } from './routes/accessMethods.js'
import { accessPlansRoutes } from './routes/accessPlans.js'
import { accessPermissionsRoutes } from './routes/accessPermissions.js'
import { accessLogsRoutes } from './routes/accessLogs.js'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: [process.env.FRONTEND_URL ?? 'http://localhost:5174', 'http://localhost:5175']
})

app.get('/health', async () => ({ status: 'ok' }))

app.register(authRoutes, { prefix: '/api/auth' })
app.register(typesRoutes, { prefix: '/api/types' })
app.register(instancesRoutes, { prefix: '/api/instances' })
app.register(personsRoutes, { prefix: '/api/persons' })
app.register(clientsRoutes, { prefix: '/api/clients' })
app.register(accessPointsRoutes, { prefix: '/api/access-points' })
app.register(accessMethodsRoutes, { prefix: '/api/access-methods' })
app.register(accessPlansRoutes, { prefix: '/api/access-plans' })
app.register(accessPermissionsRoutes, { prefix: '/api/access-permissions' })
app.register(accessLogsRoutes, { prefix: '/api/access-logs' })

const port = Number(process.env.BACKEND_PORT ?? 3001)
app.listen({ port, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1) }
})
