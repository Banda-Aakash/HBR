import 'dotenv/config';
import prisma from './prisma';

const ADMIN_ROLE = 'admin';

// Usage: npm run build && npm run make-admin -- person@example.com [--remove]
async function main() {
  const [email, flag] = process.argv.slice(2);
  if (!email) { throw new Error('Usage: npm run make-admin -- person@example.com [--remove]'); }

  const user = await prisma.user.findFirst({where: {email: {equals: email, mode: 'insensitive'}}});
  if (!user) { throw new Error(`No account uses ${email}. Sign up in the app first.`); }

  const remove = flag === '--remove';
  const otherRoles = user.roles.filter(role => role !== ADMIN_ROLE);
  await prisma.user.update({
    where: {id: user.id},
    data: {roles: remove ? otherRoles : [...otherRoles, ADMIN_ROLE]},
  });
  console.log(`${user.email} ${remove ? 'is no longer an admin' : 'is now an admin'}`);
}

main()
  .catch(e => {
    console.error(e.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
