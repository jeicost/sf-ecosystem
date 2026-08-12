import { cookieForUser } from './session'
async function main(){
  const c = await cookieForUser('alessandro@discoolver.com')
  console.log('cookie len', c.length)
  const r = await fetch('http://localhost:3033/api/brand-brain/gaps?clientId=91abb051-cae5-462d-b1fa-8e50a299e3b3', { headers: { cookie: c } })
  console.log(r.status, (await r.text()).slice(0, 500))
}
main()
