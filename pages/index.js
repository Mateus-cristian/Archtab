
function Home(){
  const ingredients = [
    "1 xícara (chá) de chocolate em pó açúcar",
    "1 xícara (chá) de açúcar",
    "2 xícaras (chá) de trigo",
    "1 xícara (chá) de óleo",
    "1 xícara (chá) de leite",
    "2 ovos de galinha(até hoje só fiz com esses)",
    "1 colher (sopa) de fermento em pó"
  ];

  const howToMake = [
    "Pré-aqueça o forno a 180°C enquanto fazemos a receita",
    "Em uma batedeira ou liquidificador forte",
    "Misture primeiramete os ingredientes leite, ovos, óleo e açucar e bata bem (3 minutinhos)",
    "Depois com uma peneira, peneire a farinha e depois o chocolate em pó e bata bem (3 minutinhos)",
    "A instrução da peneira é para deixar o bolo mais aerado, vai por mim faz diferença",
    "Por último coloque o fermento e misture com um fue ou garfo muito bem e com amor <3",
    "Unte preferencialmente com oleo ou margarina e farinha uma forma",
    "Despeje a massa na forma",
    "Leve ao forno por cerca de 30 minutos",
    "Após isso espete com uma faca, se sair limpa ou umida está pronto, se sair com macinha ,mais 5 minutos",
    "Espere esfriar antes de desenformar"
  ];

  const optional = [
    "Derreta uma barra de chocolate meio-amargo no microondas(30 segundos) mecha muito bem",
    "Se não derreter faça o mesmo processo de 15 em 15 segundos(cuidado que mais que uma vez pode queimar o chocolate)",
    "misture meio creme de leite, e voilà jogue em cima do bolo com confetti ou granulado"
  ]
  

  return (
    <>
      <h1>Receita de bolo de chocolate do Padeiro da Ti</h1>
      <pre style={{ width: 400, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
        {`Ingredientes:`}
        <ul>
          {ingredients.map((ingredient) => (
          <li>
            {ingredient}
          </li>
          ))}
        </ul>
        {`Modo de preparo:`}
        <ul>
          {howToMake.map((step) => (
          <li>
            {step}
          </li>
          ))}
        </ul>
        {`Cobertura, mas é opcional:`}
        <ul>
          {optional.map((step) => (
          <li>
            {step}
          </li>
          ))}
        </ul>
      </pre>
    </>
  )
}

export default Home;