import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  orderBy,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore'
import { deleteUser } from 'firebase/auth'
import { nanoid } from 'nanoid'
import { db, auth } from './firebase'

export async function createTrip(user, name, startDate = null, endDate = null) {
  const tripRef = doc(collection(db, 'trips'))
  const shareToken = nanoid(21)
  const tokenRef = doc(db, 'tripTokens', shareToken)

  const batch = writeBatch(db)
  batch.set(tripRef, {
    name,
    startDate,
    endDate,
    ownerId: user.uid,
    ownerEmail: user.email,
    shareToken,
    allowedUsers: [user.uid],
    allowedEmails: [user.email],
    createdAt: serverTimestamp(),
  })
  batch.set(tokenRef, {
    tripId: tripRef.id,
    createdAt: serverTimestamp(),
  })
  await batch.commit()
  return tripRef.id
}

export function getUserTrips(uid, callback) {
  const q = query(
    collection(db, 'trips'),
    where('allowedUsers', 'array-contains', uid),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(trips)
  })
}

export async function getTrip(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function joinTripByToken(shareToken, user) {
  const tokenSnap = await getDoc(doc(db, 'tripTokens', shareToken))
  if (!tokenSnap.exists()) throw new Error('Invalid share link.')

  const { tripId } = tokenSnap.data()
  const tripRef = doc(db, 'trips', tripId)

  await updateDoc(tripRef, {
    allowedUsers: arrayUnion(user.uid),
    allowedEmails: arrayUnion(user.email),
  })
  return tripId
}

export async function addPlace(tripId, user, name, mapsUrl) {
  await addDoc(collection(db, 'trips', tripId, 'places'), {
    name,
    mapsUrl,
    addedBy: user.uid,
    addedByEmail: user.email,
    addedByName: user.displayName || user.email,
    plannedDate: null,
    createdAt: serverTimestamp(),
  })
}

export async function assignPlaceToDate(tripId, placeId, date) {
  await updateDoc(doc(db, 'trips', tripId, 'places', placeId), { plannedDate: date })
}

export async function unassignPlace(tripId, placeId) {
  await updateDoc(doc(db, 'trips', tripId, 'places', placeId), { plannedDate: null })
}

export function getPlaces(tripId, callback) {
  const q = query(
    collection(db, 'trips', tripId, 'places'),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const places = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    callback(places)
  })
}

export async function deleteTrip(tripId, shareToken) {
  // Delete all places in subcollection first
  const placesSnap = await getDocs(collection(db, 'trips', tripId, 'places'))
  const batch = writeBatch(db)
  placesSnap.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(doc(db, 'trips', tripId))
  batch.delete(doc(db, 'tripTokens', shareToken))
  await batch.commit()
}

export function getShareLink(shareToken) {
  return `${window.location.origin}/join/${shareToken}`
}

export async function getUserStats(uid, email) {
  const tripsSnap = await getDocs(
    query(collection(db, 'trips'), where('allowedUsers', 'array-contains', uid))
  )
  const total = tripsSnap.size
  const owned = tripsSnap.docs.filter(d => d.data().ownerId === uid).length
  return { total, owned }
}

export async function deleteAccount(user) {
  const [ownedSnap, memberSnap] = await Promise.all([
    getDocs(query(collection(db, 'trips'), where('ownerId', '==', user.uid))),
    getDocs(query(collection(db, 'trips'), where('allowedUsers', 'array-contains', user.uid))),
  ])

  const placesSnaps = await Promise.all(
    ownedSnap.docs.map(d => getDocs(collection(db, 'trips', d.id, 'places')))
  )

  const batch = writeBatch(db)
  ownedSnap.docs.forEach((tripDoc, i) => {
    const { shareToken } = tripDoc.data()
    placesSnaps[i].docs.forEach(d => batch.delete(d.ref))
    batch.delete(tripDoc.ref)
    if (shareToken) batch.delete(doc(db, 'tripTokens', shareToken))
  })
  memberSnap.docs
    .filter(d => d.data().ownerId !== user.uid)
    .forEach(d => batch.update(d.ref, {
      allowedUsers: arrayRemove(user.uid),
      allowedEmails: arrayRemove(user.email),
    }))

  await batch.commit()
  await deleteUser(auth.currentUser)
}
