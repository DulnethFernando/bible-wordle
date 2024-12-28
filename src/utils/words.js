export const WORDS = [
    'FAITH', 'GRACE', 'PEACE', 'WHALE', 'HEART',
    'MERCY', 'PSALM', 'CROSS', 'LIGHT', 'TRUTH',
    'JESUS', 'MOSES', 'DAVID', 'JONAH', 'JUDAS',
    'GLORY', 'ANGEL', 'TRUST', 'TRUTH', 'SHEEP',
    'BLOOD', 'BREAD', 'WATER', 'WORLD', 'SWORD',
    'BIBLE', 'PETER', 'JAMES', 'TEMPT', 'CHILD'
];

export const getRandomWord = () => {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
};