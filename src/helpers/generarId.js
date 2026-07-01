const generarId = () => {
    return Date.now().toString(32) + Math.random().toString(32).substring(2);//Genera un id random 
};

export default generarId;